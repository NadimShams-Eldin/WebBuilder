import { createNode, isContainerType } from './createNode.ts'
import type { Node, NodeType, Page, Project } from './types.ts'

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
