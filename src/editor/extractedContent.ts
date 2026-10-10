import type { Node, NodeProps, NodeType } from './types.ts'

export type ExtractedFieldKind = 'text' | 'textarea'

export type ExtractedPropKey = 'text' | 'items' | 'alt' | 'placeholder'

export type ExtractedField = {
  id: string
  nodeId: string
  nodeType: NodeType
  nodeName: string
  key: ExtractedPropKey
  labelKey: string
  kind: ExtractedFieldKind
  value: string
}

type FieldDef = {
  key: ExtractedPropKey
  labelKey: string
  kind: ExtractedFieldKind
}

const EXTRACTED_FIELDS: Partial<Record<NodeType, FieldDef[]>> = {
  heading: [{ key: 'text', labelKey: 'prop.text', kind: 'textarea' }],
  text: [{ key: 'text', labelKey: 'prop.text', kind: 'textarea' }],
  list: [{ key: 'items', labelKey: 'prop.items', kind: 'textarea' }],
  link: [{ key: 'text', labelKey: 'prop.text', kind: 'text' }],
  button: [{ key: 'text', labelKey: 'prop.text', kind: 'text' }],
  image: [{ key: 'alt', labelKey: 'prop.alt', kind: 'text' }],
  icon: [{ key: 'text', labelKey: 'prop.text', kind: 'text' }],
  input: [{ key: 'placeholder', labelKey: 'prop.placeholder', kind: 'text' }],
}

export function extractedFieldValue(node: Node, key: ExtractedPropKey): string {
  const value = node.props[key]
  if (Array.isArray(value)) return value.join('\n')
  if (typeof value === 'string') return value
  return ''
}

export function propsFromExtractedValue(key: ExtractedPropKey, raw: string): NodeProps {
  if (key === 'items') return { items: raw.split('\n') }
  return { [key]: raw } as NodeProps
}

export function collectExtractedFields(root: Node): ExtractedField[] {
  const fields: ExtractedField[] = []

  const walk = (node: Node) => {
    const defs = EXTRACTED_FIELDS[node.type]
    if (defs) {
      for (const def of defs) {
        fields.push({
          id: `${node.id}:${def.key}`,
          nodeId: node.id,
          nodeType: node.type,
          nodeName: node.name,
          key: def.key,
          labelKey: def.labelKey,
          kind: def.kind,
          value: extractedFieldValue(node, def.key),
        })
      }
    }
    for (const child of node.children) walk(child)
  }

  walk(root)
  return fields
}
