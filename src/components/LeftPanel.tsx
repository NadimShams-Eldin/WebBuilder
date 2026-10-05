import { useState } from 'react'
import { NODE_TYPE_LABELS } from '../editor/createNode.ts'
import { getActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import type { Node, NodeProps } from '../editor/types.ts'
import { CONTENT_FIELDS, STYLE_GROUPS, type FieldKind } from './propertyFields.ts'

type PanelTab = 'content' | 'style'

function FieldControl({
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
  const className =
    'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800'

  if (kind === 'textarea') {
    return (
      <textarea
        rows={3}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (kind === 'select') {
    return (
      <select className={className} value={value} onChange={(event) => onChange(event.target.value)}>
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
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-neutral-200 bg-white"
          value={color}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          type="text"
          className={className}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  return (
    <input
      type={kind === 'number' ? 'number' : 'text'}
      className={className}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function propToInput(node: Node, key: string): string {
  const value = node.props[key as keyof NodeProps]
  if (Array.isArray(value)) return value.join('\n')
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === undefined || value === null) return ''
  return String(value)
}

function inputToProp(key: string, raw: string): NodeProps {
  if (key === 'items' || key === 'options') {
    return { [key]: raw.split('\n') } as NodeProps
  }
  if (key === 'ordered' || key === 'checked' || key === 'controls' || key === 'autoplay' || key === 'loop') {
    return { [key]: raw === 'true' } as NodeProps
  }
  if (key === 'level') {
    const level = Number(raw)
    return { level: (level >= 1 && level <= 6 ? level : 2) as NodeProps['level'] }
  }
  return { [key]: raw } as NodeProps
}

function styleToInput(node: Node, prop: string): string {
  const value = node.style[prop]
  return value === undefined ? '' : String(value)
}

export function LeftPanel() {
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedId)
  const updateSelected = useEditorStore((s) => s.updateSelected)
  const [tab, setTab] = useState<PanelTab>('content')
  const page = getActivePage(project)
  const node = page && selectedId ? findNode(page.root, selectedId) : null

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-3">
        <p className="text-sm font-semibold text-neutral-700">خصائص العنصر</p>
        {node ? (
          <p className="mt-1 truncate text-xs text-neutral-400">
            {node.name} · {NODE_TYPE_LABELS[node.type]}
          </p>
        ) : null}
      </div>

      {!node ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-neutral-400">
            اختر عنصرًا من الكانفا أو من شجرة الطبقات لعرض خصائصه
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-neutral-200 p-2 text-sm">
            <button
              type="button"
              onClick={() => setTab('content')}
              className={
                tab === 'content'
                  ? 'flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900'
                  : 'flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50'
              }
            >
              المحتوى
            </button>
            <button
              type="button"
              onClick={() => setTab('style')}
              className={
                tab === 'style'
                  ? 'flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900'
                  : 'flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50'
              }
            >
              الأنماط
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'content' ? (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-500">الاسم</span>
                  <FieldControl
                    kind="text"
                    value={node.name}
                    onChange={(value) => updateSelected({ name: value })}
                  />
                </label>
                {(CONTENT_FIELDS[node.type] ?? []).map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-500">{field.label}</span>
                    <FieldControl
                      kind={field.kind}
                      value={propToInput(node, field.key)}
                      options={field.options}
                      onChange={(value) => updateSelected({ props: inputToProp(field.key, value) })}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {STYLE_GROUPS.map((group) => (
                  <section key={group.id}>
                    <h3 className="mb-2 text-xs font-semibold text-neutral-400">{group.label}</h3>
                    <div className="flex flex-col gap-2">
                      {group.fields.map((field) => (
                        <label key={field.prop} className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500">{field.label}</span>
                          <FieldControl
                            kind={field.kind}
                            value={styleToInput(node, field.prop)}
                            options={field.options}
                            onChange={(value) =>
                              updateSelected({
                                style: { [field.prop]: value === '' ? undefined : value },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
