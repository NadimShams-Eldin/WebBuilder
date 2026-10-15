import type { StyleField } from '../components/propertyFields.ts'
import type { Node } from './types.ts'

export function isStyleUsed(node: Node, prop: string): boolean {
  const value = node.style[prop]
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function styleFieldUsed(node: Node, field: StyleField): boolean {
  return isStyleUsed(node, field.prop)
}

export function styleFieldMatches(field: StyleField, label: string, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle === '') return true
  return field.prop.toLowerCase().includes(needle) || label.toLowerCase().includes(needle)
}

export function filterStyleFields(
  fields: StyleField[],
  node: Node,
  options: { query: string; usedOnly: boolean; labelOf: (field: StyleField) => string },
): StyleField[] {
  const searching = options.query.trim() !== ''
  return fields.filter((field) => {
    if (searching) return styleFieldMatches(field, options.labelOf(field), options.query)
    if (options.usedOnly) return styleFieldUsed(node, field)
    return true
  })
}

export function gridColumnCount(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const text = String(value).trim()
  if (text === '') return null
  const repeat = /repeat\(\s*(\d+)/i.exec(text)
  if (repeat) return Number(repeat[1])
  const count = text.split(/\s+/).filter(Boolean).length
  return count > 0 ? count : null
}

export type StyleBadge = { id: 'display' | 'gap' | 'columns'; value: string }

export function styleBadges(node: Node): StyleBadge[] {
  const badges: StyleBadge[] = []
  const display = node.style.display
  if (display !== undefined && display !== '') badges.push({ id: 'display', value: String(display) })
  const gap = node.style.gap
  if (gap !== undefined && gap !== '') badges.push({ id: 'gap', value: String(gap) })
  const columns = gridColumnCount(node.style.gridTemplateColumns)
  if (columns !== null) badges.push({ id: 'columns', value: String(columns) })
  return badges
}
