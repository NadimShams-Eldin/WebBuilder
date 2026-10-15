import { useMemo, useState } from 'react'
import { filterStyleFields, styleBadges } from '../editor/styleInspector.ts'
import type { Node, NodeStyle } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'
import { FieldControl } from './FieldControl'
import {
  joinLength,
  LENGTH_UNITS,
  splitLength,
  STYLE_GROUPS,
  type StyleField,
} from './propertyFields.ts'

const DEFAULT_OPEN: Record<string, boolean> = {
  layout: true,
  dimensions: true,
  spacing: true,
  typography: false,
  colors: false,
  borders: false,
  effects: false,
}

const QUICK_CLASS =
  'rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-500 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-blue-400 dark:hover:text-blue-300'

export function StyleInspector({
  node,
  onChange,
}: {
  node: Node
  onChange: (style: NodeStyle) => void
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [usedOnly, setUsedOnly] = useState(false)
  const [openState, setOpenState] = useState<Record<string, boolean>>(DEFAULT_OPEN)
  const searching = query.trim() !== ''

  const sections = useMemo(
    () =>
      STYLE_GROUPS.map((group) => ({
        group,
        fields: filterStyleFields(group.fields, node, {
          query,
          usedOnly,
          labelOf: (field) => t(field.labelKey),
        }),
      })).filter((section) => section.fields.length > 0),
    [node, query, usedOnly, t],
  )

  const badges = styleBadges(node)

  const setStyle = (field: StyleField, raw: string) => {
    let value = raw
    if (field.unit && raw !== '' && splitLength(raw).unit === '') {
      value = joinLength(raw, 'px')
    }
    onChange({ [field.prop]: value === '' ? undefined : value })
  }

  const segClass = (active: boolean) =>
    active
      ? 'flex-1 rounded bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
      : 'flex-1 rounded px-2 py-1 text-[11px] text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'

  return (
    <div className="flex flex-col gap-3">
      {badges.length ? (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
            >
              {t(`insp.badge.${badge.id}`)}: {badge.value}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <input
          type="search"
          value={query}
          placeholder={t('insp.search')}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
          <button type="button" onClick={() => setUsedOnly(false)} className={segClass(!usedOnly)}>
            {t('insp.showAll')}
          </button>
          <button type="button" onClick={() => setUsedOnly(true)} className={segClass(usedOnly)}>
            {t('insp.usedOnly')}
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-xs text-neutral-400">{t('insp.noMatch')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map(({ group, fields }) => {
            const open = searching || openState[group.id]
            return (
              <section
                key={group.id}
                className="rounded-md border border-neutral-200 dark:border-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => setOpenState((prev) => ({ ...prev, [group.id]: !open }))}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300"
                >
                  <span>{t(group.labelKey)}</span>
                  <span className="text-neutral-400">{open ? '−' : '+'}</span>
                </button>
                {open ? (
                  <div className="flex flex-col gap-2 border-t border-neutral-100 p-2 dark:border-neutral-800">
                    {fields.map((field) => {
                      const value = node.style[field.prop]
                      const text = value === undefined ? '' : String(value)
                      const unit = splitLength(text).unit || 'px'
                      return (
                        <div key={field.prop} className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t(field.labelKey)}
                          </span>
                          <div className="flex items-start gap-1">
                            <div className="min-w-0 flex-1">
                              <FieldControl
                                kind={field.kind}
                                value={text}
                                options={field.optionKeys?.map((option) => ({
                                  value: option.value,
                                  label: option.labelKey ? t(option.labelKey) : option.value,
                                }))}
                                onChange={(next) => setStyle(field, next)}
                              />
                            </div>
                            {field.unit ? (
                              <select
                                aria-label={t('insp.unit')}
                                title={t('insp.unit')}
                                value={unit}
                                onChange={(event) => {
                                  const parsed = splitLength(text)
                                  if (parsed.number === '') return
                                  setStyle(field, joinLength(parsed.number, event.target.value))
                                }}
                                className="shrink-0 rounded-md border border-neutral-200 bg-white px-1 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {LENGTH_UNITS.map((candidate) => (
                                  <option key={candidate} value={candidate}>
                                    {candidate}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                          {field.quick?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {field.quick.map((candidate) => (
                                <button
                                  key={candidate}
                                  type="button"
                                  onClick={() => setStyle(field, candidate)}
                                  className={QUICK_CLASS}
                                >
                                  {candidate}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
