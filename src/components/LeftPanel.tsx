import { useState } from 'react'
import {
  ANIMATION_EASINGS,
  ANIMATION_EFFECTS,
  ANIMATION_TRIGGERS,
  DEFAULT_ANIMATION,
  isAnimationEasing,
  isAnimationEffect,
  isAnimationTrigger,
  normalizeAnimation,
} from '../editor/animation.ts'
import { assetHref, isAssetHref, parseAssetHref } from '../editor/assets.ts'
import { internalHref, isInternalHref, parseInternalHref } from '../editor/pages.ts'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import type { Node, NodeAnimation, NodeProps, Project } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'
import { CONTENT_FIELDS, STYLE_GROUPS, type FieldKind } from './propertyFields.ts'

type PanelTab = 'content' | 'style' | 'animation'

const FIELD_CLASS =
  'w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'

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

function MediaSrcFields({
  node,
  project,
  field,
  onChange,
  t,
}: {
  node: Node
  project: Project
  field: 'src' | 'poster'
  onChange: (value: string) => void
  t: (key: string) => string
}) {
  const current = field === 'src' ? node.props.src : node.props.poster
  const assetId = parseAssetHref(current) ?? ''
  const mode = isAssetHref(current) ? 'asset' : 'custom'
  const addAsset = useEditorStore((s) => s.addAsset)

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t(field === 'src' ? 'prop.src' : 'prop.poster')}
        </span>
        <FieldControl
          kind="select"
          value={mode}
          options={[
            { value: 'asset', label: t('assets.label') },
            { value: 'custom', label: t('assets.custom') },
          ]}
          onChange={(value) => {
            if (value === 'asset') {
              const first = project.assets[0]
              onChange(first ? assetHref(first.id) : '')
              return
            }
            onChange('')
          }}
        />
      </label>
      {mode === 'asset' ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('assets.label')}</span>
          <FieldControl
            kind="select"
            value={assetId}
            options={[
              { value: '', label: t('assets.none') },
              ...project.assets.map((asset) => ({ value: asset.id, label: asset.name })),
            ]}
            onChange={(value) => onChange(value ? assetHref(value) : '')}
          />
          <label className="mt-1 cursor-pointer text-xs text-blue-600 hover:underline dark:text-blue-400">
            {t('assets.upload')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                addAsset(file).then((asset) => {
                  if (asset) onChange(assetHref(asset.id))
                })
              }}
            />
          </label>
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('assets.custom')}</span>
          <FieldControl kind="text" value={current ?? ''} onChange={onChange} />
        </label>
      )}
    </>
  )
}

function LinkHrefFields({
  node,
  project,
  onChange,
  t,
}: {
  node: Node
  project: Project
  onChange: (href: string) => void
  t: (key: string) => string
}) {
  const internal = isInternalHref(node.props.href)
  const pageId = parseInternalHref(node.props.href) ?? ''
  const mode = internal ? 'internal' : 'custom'

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('prop.href')}</span>
        <FieldControl
          kind="select"
          value={mode}
          options={[
            { value: 'internal', label: t('pages.internal') },
            { value: 'custom', label: t('pages.custom') },
          ]}
          onChange={(value) => {
            if (value === 'internal') {
              const first = project.pages[0]
              onChange(first ? internalHref(first.id) : '#')
              return
            }
            onChange('#')
          }}
        />
      </label>
      {mode === 'internal' ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('pages.label')}</span>
          <FieldControl
            kind="select"
            value={pageId}
            options={project.pages.map((page) => ({ value: page.id, label: page.name }))}
            onChange={(value) => onChange(internalHref(value))}
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('pages.custom')}</span>
          <FieldControl
            kind="text"
            value={node.props.href ?? ''}
            onChange={onChange}
          />
        </label>
      )}
    </>
  )
}

function AnimationFields({
  animation,
  onChange,
  t,
}: {
  animation: NodeAnimation | null
  onChange: (animation: NodeAnimation | null) => void
  t: (key: string) => string
}) {
  const enabled = Boolean(animation)
  const current = normalizeAnimation(animation) ?? DEFAULT_ANIMATION

  const patch = (partial: Partial<NodeAnimation>) => {
    onChange({ ...current, ...partial })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-200">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked ? { ...DEFAULT_ANIMATION } : null)}
        />
        {t('anim.enable')}
      </label>
      {enabled ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('anim.trigger')}</span>
            <FieldControl
              kind="select"
              value={current.trigger}
              options={ANIMATION_TRIGGERS.map((value) => ({
                value,
                label: t(`anim.trigger.${value}`),
              }))}
              onChange={(value) => {
                if (isAnimationTrigger(value)) patch({ trigger: value })
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('anim.effect')}</span>
            <FieldControl
              kind="select"
              value={current.effect}
              options={ANIMATION_EFFECTS.map((value) => ({
                value,
                label: t(`anim.effect.${value}`),
              }))}
              onChange={(value) => {
                if (isAnimationEffect(value)) patch({ effect: value })
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('anim.duration')}</span>
            <FieldControl
              kind="number"
              value={String(current.duration)}
              onChange={(value) => patch({ duration: Number(value) })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('anim.delay')}</span>
            <FieldControl
              kind="number"
              value={String(current.delay)}
              onChange={(value) => patch({ delay: Number(value) })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('anim.easing')}</span>
            <FieldControl
              kind="select"
              value={current.easing}
              options={ANIMATION_EASINGS.map((value) => ({
                value,
                label: value,
              }))}
              onChange={(value) => {
                if (isAnimationEasing(value)) patch({ easing: value })
              }}
            />
          </label>
        </>
      ) : (
        <p className="text-xs text-neutral-400">{t('anim.empty')}</p>
      )}
    </div>
  )
}

export function LeftPanel() {
  const { t } = useI18n()
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedId)
  const updateSelected = useEditorStore((s) => s.updateSelected)
  const [tab, setTab] = useState<PanelTab>('content')
  const page = useEditorStore(selectActivePage)
  const node = page && selectedId ? findNode(page.root, selectedId) : null
  const tabClass = (active: boolean) =>
    active
      ? 'flex-1 rounded-md bg-neutral-100 px-3 py-1.5 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
      : 'flex-1 rounded-md px-3 py-1.5 text-neutral-500 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800'

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{t('panel.props')}</p>
        {node ? (
          <p className="mt-1 truncate text-xs text-neutral-400">
            {node.name} · {t(`block.${node.type}`)}
          </p>
        ) : null}
      </div>

      {!node ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm text-neutral-400">{t('panel.empty')}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-neutral-200 p-2 text-sm dark:border-neutral-800">
            <button type="button" onClick={() => setTab('content')} className={tabClass(tab === 'content')}>
              {t('tabs.content')}
            </button>
            <button type="button" onClick={() => setTab('style')} className={tabClass(tab === 'style')}>
              {t('tabs.style')}
            </button>
            <button
              type="button"
              onClick={() => setTab('animation')}
              className={tabClass(tab === 'animation')}
            >
              {t('tabs.animation')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'content' ? (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('panel.name')}</span>
                  <FieldControl
                    kind="text"
                    value={node.name}
                    onChange={(value) => updateSelected({ name: value })}
                  />
                </label>
                {node.type === 'link' ? (
                  <LinkHrefFields
                    node={node}
                    project={project}
                    t={t}
                    onChange={(href) => updateSelected({ props: { href } })}
                  />
                ) : null}
                {node.type === 'image' || node.type === 'video' ? (
                  <MediaSrcFields
                    node={node}
                    project={project}
                    field="src"
                    t={t}
                    onChange={(src) => updateSelected({ props: { src } })}
                  />
                ) : null}
                {node.type === 'video' ? (
                  <MediaSrcFields
                    node={node}
                    project={project}
                    field="poster"
                    t={t}
                    onChange={(poster) => updateSelected({ props: { poster } })}
                  />
                ) : null}
                {(CONTENT_FIELDS[node.type] ?? [])
                  .filter(
                    (field) =>
                      !(node.type === 'link' && field.key === 'href') &&
                      !((node.type === 'image' || node.type === 'video') && field.key === 'src') &&
                      !(node.type === 'video' && field.key === 'poster'),
                  )
                  .map((field) => (
                  <label key={field.key} className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(field.labelKey)}
                    </span>
                    <FieldControl
                      kind={field.kind}
                      value={propToInput(node, field.key)}
                      options={field.optionKeys?.map((option) => ({
                        value: option.value,
                        label: option.label ?? (option.labelKey ? t(option.labelKey) : option.value),
                      }))}
                      onChange={(value) => updateSelected({ props: inputToProp(field.key, value) })}
                    />
                  </label>
                ))}
              </div>
            ) : tab === 'style' ? (
              <div className="flex flex-col gap-4">
                {STYLE_GROUPS.map((group) => (
                  <section key={group.id}>
                    <h3 className="mb-2 text-xs font-semibold text-neutral-400">{t(group.labelKey)}</h3>
                    <div className="flex flex-col gap-2">
                      {group.fields.map((field) => (
                        <label key={field.prop} className="flex flex-col gap-1">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t(field.labelKey)}
                          </span>
                          <FieldControl
                            kind={field.kind}
                            value={styleToInput(node, field.prop)}
                            options={field.optionKeys?.map((option) => ({
                              value: option.value,
                              label: option.labelKey ? t(option.labelKey) : option.value,
                            }))}
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
            ) : (
              <AnimationFields
                animation={node.animation}
                onChange={(animation) => updateSelected({ animation })}
                t={t}
              />
            )}
          </div>
        </>
      )}
    </aside>
  )
}
