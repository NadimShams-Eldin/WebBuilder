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
      { prop: 'gap', labelKey: 'style.gap', kind: 'text' },
      { prop: 'gridTemplateColumns', labelKey: 'style.gridTemplateColumns', kind: 'text' },
    ],
  },
  {
    id: 'dimensions',
    labelKey: 'style.dimensions',
    fields: [
      { prop: 'width', labelKey: 'style.width', kind: 'text' },
      { prop: 'height', labelKey: 'style.height', kind: 'text' },
      { prop: 'maxWidth', labelKey: 'style.maxWidth', kind: 'text' },
      { prop: 'minHeight', labelKey: 'style.minHeight', kind: 'text' },
    ],
  },
  {
    id: 'spacing',
    labelKey: 'style.spacing',
    fields: [
      { prop: 'padding', labelKey: 'style.padding', kind: 'text' },
      { prop: 'margin', labelKey: 'style.margin', kind: 'text' },
    ],
  },
  {
    id: 'typography',
    labelKey: 'style.typography',
    fields: [
      { prop: 'fontSize', labelKey: 'style.fontSize', kind: 'text' },
      { prop: 'fontWeight', labelKey: 'style.fontWeight', kind: 'text' },
      { prop: 'lineHeight', labelKey: 'style.lineHeight', kind: 'text' },
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
      { prop: 'border', labelKey: 'style.border', kind: 'text' },
      { prop: 'borderRadius', labelKey: 'style.borderRadius', kind: 'text' },
      { prop: 'boxShadow', labelKey: 'style.boxShadow', kind: 'text' },
    ],
  },
]
