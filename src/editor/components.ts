import { createId } from './createNode.ts'
import { cloneNode, findNode, insertChild, resolveInsertTarget, type NodePatch } from './tree.ts'
import { resolvePage } from './pages.ts'
import type { ComponentDef, Node, Project } from './types.ts'

export function cloneTreeWithIds(node: Node): Node {
  return cloneNode(node)
}

function stampDefinition(node: Node, componentId: string): Node {
  return {
    ...node,
    originId: node.id,
    componentId,
    children: node.children.map((child) => stampDefinition(child, componentId)),
  }
}

function stampInstance(cloned: Node, source: Node, componentId: string): Node {
  return {
    ...cloned,
    originId: source.originId ?? source.id,
    componentId,
    children: cloned.children.map((child, index) =>
      stampInstance(child, source.children[index], componentId),
    ),
  }
}

function cloneInstance(node: Node, componentId: string): Node {
  return stampInstance(cloneNode(node), node, componentId)
}

function walkPages(project: Project, mapper: (node: Node) => Node): Project {
  return {
    ...project,
    pages: project.pages.map((page) => ({ ...page, root: mapper(page.root) })),
  }
}

function replaceMatching(node: Node, match: (item: Node) => boolean, next: (item: Node) => Node): Node {
  if (match(node)) return next(node)
  let changed = false
  const children = node.children.map((child) => {
    const mapped = replaceMatching(child, match, next)
    if (mapped !== child) changed = true
    return mapped
  })
  return changed ? { ...node, children } : node
}

export function findComponent(project: Project, id: string | undefined | null): ComponentDef | null {
  if (!id) return null
  return project.components.find((item) => item.id === id) ?? null
}

export function uniqueComponentName(project: Project, desired: string, excludeId?: string): string {
  const base = desired.trim() || 'مكوّن'
  const taken = new Set(
    project.components.filter((item) => item.id !== excludeId).map((item) => item.name),
  )
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export function countInstances(project: Project, componentId: string): number {
  let count = 0
  const walk = (node: Node) => {
    if (node.componentId === componentId && node.originId === node.componentId) count += 1
    for (const child of node.children) walk(child)
  }
  for (const page of project.pages) walk(page.root)
  return count
}

export function createComponentFromNode(
  project: Project,
  nodeId: string,
  pageId?: string | null,
  name?: string,
): { project: Project; component: ComponentDef; node: Node } | null {
  const page = resolvePage(project, pageId)
  if (!page) return null
  const source = findNode(page.root, nodeId)
  if (!source || source.id === page.root.id) return null
  if (source.componentId) return null

  const id = createId('cmp')
  const definitionRoot = stampDefinition(cloneTreeWithIds(source), id)
  definitionRoot.originId = id
  definitionRoot.componentId = id
  const component: ComponentDef = {
    id,
    name: uniqueComponentName(project, name ?? source.name),
    root: definitionRoot,
  }

  const instance = cloneInstance(definitionRoot, id)
  const nextRoot = replaceMatching(page.root, (node) => node.id === nodeId, () => instance)
  return {
    project: {
      ...project,
      components: [...project.components, component],
      pages: project.pages.map((item) => (item.id === page.id ? { ...item, root: nextRoot } : item)),
    },
    component,
    node: instance,
  }
}

export function insertComponentInstance(
  project: Project,
  componentId: string,
  selectedId: string | null,
  pageId?: string | null,
): { project: Project; node: Node } | null {
  const page = resolvePage(project, pageId)
  const component = findComponent(project, componentId)
  if (!page || !component) return null
  const target = resolveInsertTarget(page.root, selectedId)
  if (!target) return null
  const instance = cloneInstance(component.root, component.id)
  const root = insertChild(page.root, target.parentId, instance, target.index)
  if (!root) return null
  return {
    project: {
      ...project,
      pages: project.pages.map((item) => (item.id === page.id ? { ...item, root } : item)),
    },
    node: instance,
  }
}

function applyPatchToDefinition(node: Node, originId: string, patch: NodePatch): Node {
  if (node.originId === originId || (!node.originId && node.id === originId)) {
    return {
      ...node,
      name: patch.name ?? node.name,
      props: patch.props ? { ...node.props, ...patch.props } : node.props,
      style: patch.style ? { ...node.style, ...patch.style } : node.style,
      animation: patch.animation !== undefined ? patch.animation : node.animation,
    }
  }
  let changed = false
  const children = node.children.map((child) => {
    const next = applyPatchToDefinition(child, originId, patch)
    if (next !== child) changed = true
    return next
  })
  return changed ? { ...node, children } : node
}

export function updateComponentInstances(
  project: Project,
  nodeId: string,
  patch: NodePatch,
  pageId?: string | null,
): Project | null {
  const page = resolvePage(project, pageId)
  if (!page) return null
  const source = findNode(page.root, nodeId)
  if (!source?.componentId || !source.originId) return null
  const component = findComponent(project, source.componentId)
  if (!component) return null

  const nextDefinition = applyPatchToDefinition(component.root, source.originId, patch)
  const nextComponents = project.components.map((item) =>
    item.id === component.id ? { ...item, root: nextDefinition } : item,
  )

  const nextPages = project.pages.map((item) => ({
    ...item,
    root: replaceMatching(
      item.root,
      (node) => node.componentId === component.id && node.originId === source.originId,
      (node) => ({
        ...node,
        name: patch.name ?? node.name,
        props: patch.props ? { ...node.props, ...patch.props } : node.props,
        style: patch.style ? { ...node.style, ...patch.style } : node.style,
        animation: patch.animation !== undefined ? patch.animation : node.animation,
      }),
    ),
  }))

  return { ...project, components: nextComponents, pages: nextPages }
}

export function detachInstance(
  project: Project,
  nodeId: string,
  pageId?: string | null,
): Project | null {
  const page = resolvePage(project, pageId)
  if (!page) return null
  const source = findNode(page.root, nodeId)
  if (!source?.componentId) return null

  const strip = (node: Node): Node => ({
    ...node,
    componentId: undefined,
    originId: undefined,
    children: node.children.map(strip),
  })

  const nextRoot = replaceMatching(page.root, (node) => node.id === nodeId, strip)
  return {
    ...project,
    pages: project.pages.map((item) => (item.id === page.id ? { ...item, root: nextRoot } : item)),
  }
}

export function renameComponent(project: Project, componentId: string, name: string): Project | null {
  const component = findComponent(project, componentId)
  if (!component) return null
  const nextName = uniqueComponentName(project, name, componentId)
  return {
    ...project,
    components: project.components.map((item) =>
      item.id === componentId ? { ...item, name: nextName } : item,
    ),
  }
}

export function deleteComponent(project: Project, componentId: string): Project | null {
  if (!findComponent(project, componentId)) return null
  const strip = (node: Node): Node => {
    const nextChildren = node.children.map(strip)
    if (node.componentId !== componentId) {
      return nextChildren === node.children ? node : { ...node, children: nextChildren }
    }
    return {
      ...node,
      componentId: undefined,
      originId: undefined,
      children: nextChildren,
    }
  }
  return {
    ...walkPages(project, strip),
    components: project.components.filter((item) => item.id !== componentId),
  }
}

export function syncInstanceFromDefinition(instance: Node, definition: Node): Node {
  const defByOrigin = new Map<string, Node>()
  const collect = (node: Node) => {
    if (node.originId) defByOrigin.set(node.originId, node)
    for (const child of node.children) collect(child)
  }
  collect(definition)

  const apply = (node: Node): Node => {
    const source = node.originId ? defByOrigin.get(node.originId) : undefined
    const nextChildren = node.children.map(apply)
    if (!source) return nextChildren === node.children ? node : { ...node, children: nextChildren }
    return {
      ...node,
      name: source.name,
      props: { ...source.props },
      style: { ...source.style },
      animation: source.animation ? { ...source.animation } : null,
      children: nextChildren,
    }
  }
  return apply(instance)
}
