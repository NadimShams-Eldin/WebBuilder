import { createNode, isContainerType } from './createNode.ts'
import type { Node, NodeProps, NodeStyle, NodeType, Page, Project } from './types.ts'

export function findNode(node: Node, id: string): Node | null {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export function findParent(node: Node, id: string): Node | null {
  for (const child of node.children) {
    if (child.id === id) return node
    const found = findParent(child, id)
    if (found) return found
  }
  return null
}

export function getAncestorIds(root: Node, id: string): string[] {
  const path: string[] = []

  const walk = (node: Node, acc: string[]): boolean => {
    if (node.id === id) {
      path.push(...acc)
      return true
    }
    for (const child of node.children) {
      if (walk(child, [...acc, node.id])) return true
    }
    return false
  }

  walk(root, [])
  return path
}

export type InsertTarget = {
  parentId: string
  index: number
  parent: Node
}

export function resolveInsertTarget(root: Node, selectedId: string | null): InsertTarget | null {
  if (!selectedId || selectedId === root.id) {
    if (!isContainerType(root.type)) return null
    return { parentId: root.id, index: root.children.length, parent: root }
  }

  const selected = findNode(root, selectedId)
  if (!selected) {
    if (!isContainerType(root.type)) return null
    return { parentId: root.id, index: root.children.length, parent: root }
  }

  if (isContainerType(selected.type)) {
    return { parentId: selected.id, index: selected.children.length, parent: selected }
  }

  const parent = findParent(root, selected.id)
  if (!parent || !isContainerType(parent.type)) return null
  const index = parent.children.findIndex((child) => child.id === selected.id)
  return { parentId: parent.id, index: index + 1, parent }
}

export function insertChild(root: Node, parentId: string, child: Node, index: number): Node | null {
  let inserted = false

  const walk = (node: Node): Node => {
    if (node.id === parentId) {
      if (!isContainerType(node.type)) return node
      inserted = true
      const children = [...node.children]
      const at = Math.max(0, Math.min(index, children.length))
      children.splice(at, 0, child)
      return { ...node, children }
    }
    let changed = false
    const children = node.children.map((item) => {
      const next = walk(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...node, children } : node
  }

  const next = walk(root)
  return inserted ? next : null
}

export function addNodeToPage(page: Page, selectedId: string | null, type: NodeType): { page: Page; node: Node } | null {
  const target = resolveInsertTarget(page.root, selectedId)
  if (!target) return null
  const node = createNode(type)
  const root = insertChild(page.root, target.parentId, node, target.index)
  if (!root) return null
  return { page: { ...page, root }, node }
}

export type NodePatch = {
  name?: string
  props?: NodeProps
  style?: NodeStyle
}

export function updateNode(root: Node, id: string, patch: NodePatch): Node | null {
  let found = false

  const walk = (node: Node): Node => {
    if (node.id === id) {
      found = true
      return {
        ...node,
        name: patch.name ?? node.name,
        props: patch.props ? { ...node.props, ...patch.props } : node.props,
        style: patch.style ? { ...node.style, ...patch.style } : node.style,
      }
    }
    let changed = false
    const children = node.children.map((item) => {
      const next = walk(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...node, children } : node
  }

  const next = walk(root)
  return found ? next : null
}

export function updateNodeInProject(
  project: Project,
  id: string,
  patch: NodePatch,
): Project | null {
  const page = project.pages[0]
  if (!page) return null
  const root = updateNode(page.root, id, patch)
  if (!root) return null
  return {
    ...project,
    pages: project.pages.map((item) => (item.id === page.id ? { ...page, root } : item)),
  }
}

export function addNodeToProject(
  project: Project,
  selectedId: string | null,
  type: NodeType,
): { project: Project; node: Node } | null {
  const page = project.pages[0]
  if (!page) return null
  const result = addNodeToPage(page, selectedId, type)
  if (!result) return null
  return {
    project: {
      ...project,
      pages: project.pages.map((item) => (item.id === page.id ? result.page : item)),
    },
    node: result.node,
  }
}

export type DropPlacement = 'before' | 'after' | 'inside'

export type DropIntent = {
  targetId: string
  placement: DropPlacement
  axis?: 'vertical' | 'horizontal'
  rtl?: boolean
}

export function isAncestorOf(root: Node, ancestorId: string, nodeId: string): boolean {
  return getAncestorIds(root, nodeId).includes(ancestorId)
}

export function canDrop(root: Node, intent: DropIntent, draggedId?: string | null): boolean {
  const target = findNode(root, intent.targetId)
  if (!target) return false

  if (draggedId) {
    if (draggedId === intent.targetId) return false
    if (isAncestorOf(root, draggedId, intent.targetId)) return false
  }

  if (intent.placement === 'inside') {
    return isContainerType(target.type)
  }

  if (target.id === root.id) return false
  const parent = findParent(root, target.id)
  return Boolean(parent && isContainerType(parent.type))
}

export function resolveDropInsert(root: Node, intent: DropIntent): InsertTarget | null {
  if (!canDrop(root, intent)) return null
  const target = findNode(root, intent.targetId)
  if (!target) return null

  if (intent.placement === 'inside') {
    return { parentId: target.id, index: target.children.length, parent: target }
  }

  const parent = findParent(root, target.id)
  if (!parent) return null
  const index = parent.children.findIndex((child) => child.id === target.id)
  if (index < 0) return null
  return {
    parentId: parent.id,
    index: intent.placement === 'before' ? index : index + 1,
    parent,
  }
}

export function insertAtDrop(root: Node, child: Node, intent: DropIntent): Node | null {
  const target = resolveDropInsert(root, intent)
  if (!target) return null
  return insertChild(root, target.parentId, child, target.index)
}

export function removeNode(root: Node, id: string): { root: Node; node: Node } | null {
  if (root.id === id) return null
  const node = findNode(root, id)
  if (!node) return null

  const walk = (current: Node): Node => {
    if (current.children.some((child) => child.id === id)) {
      return { ...current, children: current.children.filter((child) => child.id !== id) }
    }
    let changed = false
    const children = current.children.map((item) => {
      const next = walk(item)
      if (next !== item) changed = true
      return next
    })
    return changed ? { ...current, children } : current
  }

  return { root: walk(root), node }
}

export function moveNode(root: Node, nodeId: string, intent: DropIntent): Node | null {
  if (!canDrop(root, intent, nodeId)) return null
  const extracted = removeNode(root, nodeId)
  if (!extracted) return null
  const target = resolveDropInsert(extracted.root, intent)
  if (!target) return null
  return insertChild(extracted.root, target.parentId, extracted.node, target.index)
}

function patchActivePage(project: Project, root: Node): Project {
  const page = project.pages[0]
  if (!page) return project
  return {
    ...project,
    pages: project.pages.map((item) => (item.id === page.id ? { ...page, root } : item)),
  }
}

export function insertAtDropInProject(
  project: Project,
  type: NodeType,
  intent: DropIntent,
): { project: Project; node: Node } | null {
  const page = project.pages[0]
  if (!page) return null
  const node = createNode(type)
  const root = insertAtDrop(page.root, node, intent)
  if (!root) return null
  return { project: patchActivePage(project, root), node }
}

export function moveNodeInProject(
  project: Project,
  nodeId: string,
  intent: DropIntent,
): Project | null {
  const page = project.pages[0]
  if (!page) return null
  const root = moveNode(page.root, nodeId, intent)
  if (!root) return null
  return patchActivePage(project, root)
}
