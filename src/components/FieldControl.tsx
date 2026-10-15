import type { FieldKind } from './propertyFields.ts'

export const FIELD_CLASS =
  'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'

export function FieldControl({
  kind,
  value,
  options,
  onChange,
}: {
  kind: FieldKind
  value: string
  options?: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  if (kind === 'textarea') {
    return (
      <textarea
        rows={3}
        className={FIELD_CLASS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (kind === 'select') {
    return (
      <select className={FIELD_CLASS} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {(options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (kind === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={(event) => onChange(event.target.checked ? 'true' : 'false')}
      />
    )
  }

  if (kind === 'color') {
    const color = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : '#000000'
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-neutral-200 bg-white dark:border-neutral-700"
          value={color}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className={FIELD_CLASS}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  return (
    <input
      type={kind === 'number' ? 'number' : 'text'}
      className={FIELD_CLASS}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
