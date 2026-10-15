import type { NodeType } from '../editor/types.ts'

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'color'

export type PropField = {
  key: string
  labelKey: string
  kind: FieldKind
  optionKeys?: Array<{ value: string; labelKey?: string; label?: string }>
}

export type StyleField = {
  prop: string
  labelKey: string
  kind: FieldKind
  optionKeys?: Array<{ value: string; labelKey?: string }>
  unit?: boolean
  quick?: string[]
}

export const LENGTH_UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh'] as const

export function splitLength(value: string): { number: string; unit: string } {
  const match = /^(-?\d*\.?\d+)\s*([a-z%]*)$/i.exec(value.trim())
  if (!match) return { number: '', unit: '' }
  return { number: match[1], unit: match[2] || 'px' }
}

export function joinLength(value: string, unit: string): string {
  if (value === '') return ''
  return /^-?\d*\.?\d+$/.test(value.trim()) ? `${value}${unit}` : value
}

export const CONTENT_FIELDS: Partial<Record<NodeType, PropField[]>> = {
  heading: [
    { key: 'text', labelKey: 'prop.text', kind: 'textarea' },
    {
      key: 'level',
      labelKey: 'prop.level',
      kind: 'select',
      optionKeys: [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `H${n}` })),
    },
  ],
  text: [{ key: 'text', labelKey: 'prop.text', kind: 'textarea' }],
  list: [
    { key: 'items', labelKey: 'prop.items', kind: 'textarea' },
    { key: 'ordered', labelKey: 'prop.ordered', kind: 'checkbox' },
  ],
  link: [
    { key: 'text', labelKey: 'prop.text', kind: 'text' },
    { key: 'href', labelKey: 'prop.href', kind: 'text' },
    {
      key: 'target',
      labelKey: 'prop.target',
      kind: 'select',
      optionKeys: [
        { value: '_self', labelKey: 'target.self' },
        { value: '_blank', labelKey: 'target.blank' },
      ],
    },
  ],
  image: [
    { key: 'src', labelKey: 'prop.src', kind: 'text' },
    { key: 'alt', labelKey: 'prop.alt', kind: 'text' },
  ],
  icon: [
    { key: 'text', labelKey: 'prop.text', kind: 'text' },
    { key: 'label', labelKey: 'prop.label', kind: 'text' },
  ],
  video: [
    { key: 'src', labelKey: 'prop.src', kind: 'text' },
    { key: 'poster', labelKey: 'prop.poster', kind: 'text' },
    { key: 'controls', labelKey: 'prop.controls', kind: 'checkbox' },
    { key: 'autoplay', labelKey: 'prop.autoplay', kind: 'checkbox' },
    { key: 'loop', labelKey: 'prop.loop', kind: 'checkbox' },
  ],
  button: [
    { key: 'text', labelKey: 'prop.text', kind: 'text' },
    {
      key: 'type',
      labelKey: 'prop.type',
      kind: 'select',
      optionKeys: [
        { value: 'button', labelKey: 'button.button' },
        { value: 'submit', labelKey: 'button.submit' },
        { value: 'reset', labelKey: 'button.reset' },
      ],
    },
  ],
  input: [
    {
      key: 'inputType',
      labelKey: 'prop.inputType',
      kind: 'select',
      optionKeys: [
        { value: 'text', labelKey: 'input.text' },
        { value: 'email', labelKey: 'input.email' },
        { value: 'password', labelKey: 'input.password' },
        { value: 'textarea', labelKey: 'input.textarea' },
        { value: 'select', labelKey: 'input.select' },
        { value: 'checkbox', labelKey: 'input.checkbox' },
        { value: 'radio', labelKey: 'input.radio' },
      ],
    },
    { key: 'name', labelKey: 'prop.name', kind: 'text' },
    { key: 'placeholder', labelKey: 'prop.placeholder', kind: 'text' },
    { key: 'value', labelKey: 'prop.value', kind: 'text' },
    { key: 'options', labelKey: 'prop.options', kind: 'textarea' },
    { key: 'checked', labelKey: 'prop.checked', kind: 'checkbox' },
  ],
  form: [
    { key: 'action', labelKey: 'prop.action', kind: 'text' },
    {
      key: 'method',
      labelKey: 'prop.method',
      kind: 'select',
      optionKeys: [
        { value: 'post', label: 'POST' },
        { value: 'get', label: 'GET' },
      ],
    },
  ],
}

export const STYLE_GROUPS: Array<{ id: string; labelKey: string; fields: StyleField[] }> = [
  {
    id: 'layout',
    labelKey: 'style.layout',
    fields: [
      {
        prop: 'display',
        labelKey: 'style.display',
        kind: 'select',
        optionKeys: ['block', 'flex', 'grid', 'inline-flex', 'none'].map((v) => ({ value: v })),
      },
      {
        prop: 'flexDirection',
        labelKey: 'style.flexDirection',
        kind: 'select',
        optionKeys: ['row', 'column', 'row-reverse', 'column-reverse'].map((v) => ({ value: v })),
      },
      {
        prop: 'justifyContent',
        labelKey: 'style.justifyContent',
        kind: 'select',
        optionKeys: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'].map(
          (v) => ({ value: v }),
        ),
      },
      {
        prop: 'alignItems',
        labelKey: 'style.alignItems',
        kind: 'select',
        optionKeys: ['stretch', 'flex-start', 'center', 'flex-end'].map((v) => ({ value: v })),
      },
      {
        prop: 'gap',
        labelKey: 'style.gap',
        kind: 'text',
        unit: true,
        quick: ['0', '4px', '8px', '12px', '16px', '24px'],
      },
      {
        prop: 'gridTemplateColumns',
        labelKey: 'style.gridTemplateColumns',
        kind: 'text',
        quick: ['1fr', '1fr 1fr', '1fr 1fr 1fr', 'repeat(3, 1fr)'],
      },
    ],
  },
  {
    id: 'dimensions',
    labelKey: 'style.dimensions',
    fields: [
      { prop: 'width', labelKey: 'style.width', kind: 'text', unit: true, quick: ['auto', '100%', '50%'] },
      { prop: 'height', labelKey: 'style.height', kind: 'text', unit: true, quick: ['auto', '100%'] },
      { prop: 'maxWidth', labelKey: 'style.maxWidth', kind: 'text', unit: true, quick: ['480px', '768px', '1200px'] },
      { prop: 'minHeight', labelKey: 'style.minHeight', kind: 'text', unit: true, quick: ['0', '100vh'] },
    ],
  },
  {
    id: 'spacing',
    labelKey: 'style.spacing',
    fields: [
      {
        prop: 'padding',
        labelKey: 'style.padding',
        kind: 'text',
        unit: true,
        quick: ['0', '4px', '8px', '16px', '24px', '32px'],
      },
      {
        prop: 'margin',
        labelKey: 'style.margin',
        kind: 'text',
        unit: true,
        quick: ['0', 'auto', '8px', '16px', '24px'],
      },
    ],
  },
  {
    id: 'typography',
    labelKey: 'style.typography',
    fields: [
      {
        prop: 'fontSize',
        labelKey: 'style.fontSize',
        kind: 'text',
        unit: true,
        quick: ['12px', '14px', '16px', '20px', '24px', '32px'],
      },
      {
        prop: 'fontWeight',
        labelKey: 'style.fontWeight',
        kind: 'text',
        quick: ['400', '500', '600', '700'],
      },
      { prop: 'lineHeight', labelKey: 'style.lineHeight', kind: 'text', quick: ['1', '1.25', '1.5', '2'] },
      {
        prop: 'textAlign',
        labelKey: 'style.textAlign',
        kind: 'select',
        optionKeys: ['start', 'center', 'end', 'justify'].map((v) => ({ value: v })),
      },
    ],
  },
  {
    id: 'colors',
    labelKey: 'style.colors',
    fields: [
      { prop: 'color', labelKey: 'style.color', kind: 'color' },
      { prop: 'backgroundColor', labelKey: 'style.backgroundColor', kind: 'color' },
    ],
  },
  {
    id: 'borders',
    labelKey: 'style.borders',
    fields: [
      { prop: 'border', labelKey: 'style.border', kind: 'text', quick: ['none', '1px solid'] },
      {
        prop: 'borderRadius',
        labelKey: 'style.borderRadius',
        kind: 'text',
        unit: true,
        quick: ['0', '4px', '8px', '16px', '9999px'],
      },
    ],
  },
  {
    id: 'effects',
    labelKey: 'style.effects',
    fields: [
      {
        prop: 'boxShadow',
        labelKey: 'style.boxShadow',
        kind: 'text',
        quick: ['none', '0 1px 2px rgba(0,0,0,.1)', '0 4px 12px rgba(0,0,0,.15)'],
      },
      { prop: 'opacity', labelKey: 'style.opacity', kind: 'text', quick: ['1', '0.75', '0.5'] },
    ],
  },
]
