import { useState } from 'react'
import { floatingMenuPosition } from '../editor/canvasGuides.ts'
import { useEditorStore } from '../editor/store.ts'
import type { Node, NodeType } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'

type GuideRect = { top: number; left: number; width: number; height: number }

const WRAP_TYPES: Array<{ type: NodeType; labelKey: string }> = [
  { type: 'container', labelKey: 'action.wrapContainer' },
  { type: 'flex', labelKey: 'action.wrapFlex' },
  { type: 'grid', labelKey: 'action.wrapGrid' },
]

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      {children}
    </svg>
  )
}

const BUTTON_CLASS =
  'flex h-6 w-6 items-center justify-center rounded text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'

export function SelectionToolbar({
  node,
  rect,
  frameWidth,
  rtl,
  size,
}: {
  node: Node
  rect: GuideRect
  frameWidth: number
  rtl: boolean
  size?: string
}) {
  const { t } = useI18n()
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const wrapSelected = useEditorStore((s) => s.wrapSelected)
  const copySelectedStyle = useEditorStore((s) => s.copySelectedStyle)
  const pasteStyleToSelected = useEditorStore((s) => s.pasteStyleToSelected)
  const styleClipboard = useEditorStore((s) => s.styleClipboard)
  const createComponentFromSelected = useEditorStore((s) => s.createComponentFromSelected)
  const detachSelectedComponent = useEditorStore((s) => s.detachSelectedComponent)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const [wrapOpen, setWrapOpen] = useState(false)
  const position = floatingMenuPosition(rect, frameWidth, rtl)

  const onStyle = () => {
    if (styleClipboard) pasteStyleToSelected()
    else copySelectedStyle()
  }

  return (
    <div
      className="pointer-events-auto absolute z-10 flex items-center gap-0.5 rounded-md border border-neutral-200 bg-white p-0.5 text-xs shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      data-guide="menu"
      style={{ top: position.top, left: position.left }}
    >
      <span className="max-w-28 truncate px-1.5 text-[10px] font-medium text-neutral-700 dark:text-neutral-200">
        {node.name}
      </span>
      {size ? <span className="px-1 text-[10px] text-neutral-400">{size}</span> : null}
      <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
      <button
        type="button"
        className={BUTTON_CLASS}
        title={`${t('guide.duplicate')} (Ctrl+D)`}
        aria-label={t('guide.duplicate')}
        onClick={() => duplicateSelected()}
      >
        <Icon>
          <rect x="5" y="2.5" width="8" height="8" rx="1.5" />
          <path d="M11 12.5H4.5A1.5 1.5 0 0 1 3 11V4.5" />
        </Icon>
      </button>

      <div className="relative">
        <button
          type="button"
          className={BUTTON_CLASS}
          title={t('action.wrap')}
          aria-label={t('action.wrap')}
          aria-expanded={wrapOpen}
          onClick={() => setWrapOpen((value) => !value)}
        >
          <Icon>
            <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" strokeDasharray="2 2" />
            <rect x="5" y="5" width="6" height="6" rx="1" />
          </Icon>
        </button>
        {wrapOpen ? (
          <div
            className="absolute top-full z-10 mt-1 min-w-28 overflow-hidden rounded-md border border-neutral-200 bg-white py-0.5 shadow-md dark:border-neutral-700 dark:bg-neutral-900"
            style={rtl ? { right: 0 } : { left: 0 }}
          >
            {WRAP_TYPES.map((option) => (
              <button
                key={option.type}
                type="button"
                className="flex w-full items-center px-3 py-1.5 text-start text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => {
                  setWrapOpen(false)
                  wrapSelected(option.type)
                }}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={BUTTON_CLASS}
        title={styleClipboard ? t('action.pasteStyle') : t('action.copyStyle')}
        aria-label={styleClipboard ? t('action.pasteStyle') : t('action.copyStyle')}
        onClick={onStyle}
      >
        <Icon>
          {styleClipboard ? (
            <>
              <rect x="4" y="2.5" width="8" height="11" rx="1.5" />
              <path d="M6.5 5.5h3M6.5 8h3M6.5 10.5h2" />
            </>
          ) : (
            <path d="M5 3.5h6v3H5zM7.5 6.5v3.5M6 11.5h3v2H6z" />
          )}
        </Icon>
      </button>

      {node.componentId ? (
        <button
          type="button"
          className={BUTTON_CLASS}
          title={t('action.detachComponent')}
          aria-label={t('action.detachComponent')}
          onClick={() => detachSelectedComponent()}
        >
          <Icon>
            <path d="M4 8h8M6 5.5 3.5 8 6 10.5M10 5.5 12.5 8 10 10.5" />
          </Icon>
        </button>
      ) : (
        <button
          type="button"
          className={BUTTON_CLASS}
          title={t('action.saveComponent')}
          aria-label={t('action.saveComponent')}
          onClick={() => {
            const name = window.prompt(t('comp.promptName'))
            if (name === null) return
            if (createComponentFromSelected(name)) setRightTab('components')
          }}
        >
          <Icon>
            <rect x="3" y="3" width="10" height="10" rx="1.5" />
            <path d="M6 8h4M8 6v4" />
          </Icon>
        </button>
      )}

      <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        title={t('guide.delete')}
        aria-label={t('guide.delete')}
        onClick={() => deleteSelected()}
      >
        <Icon>
          <path d="M3.5 4.5h9M6 4.5V3h4v1.5M5 4.5l.6 8.5h4.8l.6-8.5" />
        </Icon>
      </button>
      <span className="px-1 text-[10px] text-neutral-400">{node.type}</span>
    </div>
  )
}
