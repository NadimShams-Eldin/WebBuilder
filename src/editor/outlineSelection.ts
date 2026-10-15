import type { Node } from './types.ts'

export function matchingIdsWithAncestors(root: Node, match: (node: Node) => boolean): Set<string> {
  const visible = new Set<string>()

  const walk = (node: Node, ancestors: string[]) => {
    if (match(node)) {
      visible.add(node.id)
      for (const id of ancestors) visible.add(id)
    }
    for (const child of node.children) walk(child, [...ancestors, node.id])
  }

  walk(root, [])
  return visible
}

export function flattenVisible(
  root: Node,
  isOpen: (node: Node) => boolean,
  visible: Set<string> | null,
): Node[] {
  const out: Node[] = []

  const walk = (node: Node) => {
    if (visible && !visible.has(node.id)) return
    out.push(node)
    if (isOpen(node)) node.children.forEach(walk)
  }

  walk(root)
  return out
}

export function rangeSelection(flat: Node[], fromId: string, toId: string): string[] {
  const from = flat.findIndex((node) => node.id === fromId)
  const to = flat.findIndex((node) => node.id === toId)
  if (from === -1 || to === -1) return []
  const [start, end] = from < to ? [from, to] : [to, from]
  return flat.slice(start, end + 1).map((node) => node.id)
}
