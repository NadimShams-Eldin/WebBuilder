import type { NodeType } from '../editor/types.ts'

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'color'

export type PropField = {
  key: string
  label: string
  kind: FieldKind
  options?: Array<{ value: string; label: string }>
}

export type StyleField = {
  prop: string
  label: string
  kind: FieldKind
  options?: Array<{ value: string; label: string }>
}

export const CONTENT_FIELDS: Partial<Record<NodeType, PropField[]>> = {
  heading: [
    { key: 'text', label: 'النص', kind: 'textarea' },
    {
      key: 'level',
      label: 'المستوى',
      kind: 'select',
      options: [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `H${n}` })),
    },
  ],
  text: [{ key: 'text', label: 'النص', kind: 'textarea' }],
  list: [
    { key: 'items', label: 'العناصر (سطر لكل عنصر)', kind: 'textarea' },
    { key: 'ordered', label: 'قائمة مرقّمة', kind: 'checkbox' },
  ],
  link: [
    { key: 'text', label: 'النص', kind: 'text' },
    { key: 'href', label: 'الرابط', kind: 'text' },
    {
      key: 'target',
      label: 'الهدف',
      kind: 'select',
      options: [
        { value: '_self', label: 'نفس النافذة' },
        { value: '_blank', label: 'نافذة جديدة' },
      ],
    },
  ],
  image: [
    { key: 'src', label: 'المصدر', kind: 'text' },
    { key: 'alt', label: 'النص البديل', kind: 'text' },
  ],
  icon: [
    { key: 'text', label: 'الرمز', kind: 'text' },
    { key: 'label', label: 'التسمية', kind: 'text' },
  ],
  video: [
    { key: 'src', label: 'المصدر', kind: 'text' },
    { key: 'poster', label: 'صورة الغلاف', kind: 'text' },
    { key: 'controls', label: 'أزرار التحكم', kind: 'checkbox' },
    { key: 'autoplay', label: 'تشغيل تلقائي', kind: 'checkbox' },
    { key: 'loop', label: 'تكرار', kind: 'checkbox' },
  ],
  button: [
    { key: 'text', label: 'النص', kind: 'text' },
    {
      key: 'type',
      label: 'النوع',
      kind: 'select',
      options: [
        { value: 'button', label: 'زر' },
        { value: 'submit', label: 'إرسال' },
        { value: 'reset', label: 'إعادة' },
      ],
    },
  ],
  input: [
    {
      key: 'inputType',
      label: 'نوع الحقل',
      kind: 'select',
      options: [
        { value: 'text', label: 'نص' },
        { value: 'email', label: 'بريد' },
        { value: 'password', label: 'كلمة مرور' },
        { value: 'textarea', label: 'مساحة نص' },
        { value: 'select', label: 'قائمة' },
        { value: 'checkbox', label: 'اختيار' },
        { value: 'radio', label: 'راديو' },
      ],
    },
    { key: 'name', label: 'الاسم', kind: 'text' },
    { key: 'placeholder', label: 'النص التوضيحي', kind: 'text' },
    { key: 'value', label: 'القيمة', kind: 'text' },
    { key: 'options', label: 'الخيارات (سطر لكل خيار)', kind: 'textarea' },
    { key: 'checked', label: 'محدد', kind: 'checkbox' },
  ],
  form: [
    { key: 'action', label: 'المسار', kind: 'text' },
    {
      key: 'method',
      label: 'الطريقة',
      kind: 'select',
      options: [
        { value: 'post', label: 'POST' },
        { value: 'get', label: 'GET' },
      ],
    },
  ],
}

export const STYLE_GROUPS: Array<{ id: string; label: string; fields: StyleField[] }> = [
  {
    id: 'layout',
    label: 'تخطيط',
    fields: [
      {
        prop: 'display',
        label: 'العرض',
        kind: 'select',
        options: ['block', 'flex', 'grid', 'inline-flex', 'none'].map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        prop: 'flexDirection',
        label: 'اتجاه المرن',
        kind: 'select',
        options: ['row', 'column', 'row-reverse', 'column-reverse'].map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        prop: 'justifyContent',
        label: 'التوزيع',
        kind: 'select',
        options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'].map((v) => ({
          value: v,
          label: v,
        })),
      },
      {
        prop: 'alignItems',
        label: 'المحاذاة',
        kind: 'select',
        options: ['stretch', 'flex-start', 'center', 'flex-end'].map((v) => ({
          value: v,
          label: v,
        })),
      },
      { prop: 'gap', label: 'الفجوة', kind: 'text' },
      { prop: 'gridTemplateColumns', label: 'أعمدة الشبكة', kind: 'text' },
    ],
  },
  {
    id: 'dimensions',
    label: 'أبعاد',
    fields: [
      { prop: 'width', label: 'العرض', kind: 'text' },
      { prop: 'height', label: 'الارتفاع', kind: 'text' },
      { prop: 'maxWidth', label: 'أقصى عرض', kind: 'text' },
      { prop: 'minHeight', label: 'أدنى ارتفاع', kind: 'text' },
    ],
  },
  {
    id: 'spacing',
    label: 'مسافات',
    fields: [
      { prop: 'padding', label: 'الحشو', kind: 'text' },
      { prop: 'margin', label: 'الهامش', kind: 'text' },
    ],
  },
  {
    id: 'typography',
    label: 'خطوط',
    fields: [
      { prop: 'fontSize', label: 'الحجم', kind: 'text' },
      { prop: 'fontWeight', label: 'الوزن', kind: 'text' },
      { prop: 'lineHeight', label: 'ارتفاع السطر', kind: 'text' },
      {
        prop: 'textAlign',
        label: 'محاذاة النص',
        kind: 'select',
        options: ['start', 'center', 'end', 'justify'].map((v) => ({ value: v, label: v })),
      },
    ],
  },
  {
    id: 'colors',
    label: 'ألوان',
    fields: [
      { prop: 'color', label: 'لون النص', kind: 'color' },
      { prop: 'backgroundColor', label: 'لون الخلفية', kind: 'color' },
    ],
  },
  {
    id: 'borders',
    label: 'حدود',
    fields: [
      { prop: 'border', label: 'الحد', kind: 'text' },
      { prop: 'borderRadius', label: 'الاستدارة', kind: 'text' },
      { prop: 'boxShadow', label: 'الظل', kind: 'text' },
    ],
  },
]
