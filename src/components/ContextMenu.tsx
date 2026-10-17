import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  clampMenuPosition,
  firstEnabledIndex,
  lastEnabledIndex,
  nextMenuIndex,
  type ContextAction,
  type MenuEntry,
} from '../editor/contextMenu.ts'
import { useI18n } from '../editor/useI18n.ts'

export type ContextMenuState = {
  x: number
  y: number
  entries: MenuEntry[]
  title?: string
  onSelect: (action: ContextAction) => void
}

const MENU_WIDTH = 220

export function ContextMenu({ menu, onClose }: { menu: ContextMenuState; onClose: () => void }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: menu.x, y: menu.y })
  const [active, setActive] = useState(() => Math.max(0, firstEnabledIndex(menu.entries)))

  useLayoutEffect(() => {
    const el = ref.current
    const height = el?.offsetHeight ?? menu.entries.length * 30
    setPosition(
      clampMenuPosition(menu.x, menu.y, MENU_WIDTH, height, window.innerWidth, window.innerHeight),
    )
    el?.focus()
  }, [menu])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        setActive((current) => nextMenuIndex(menu.entries, current, delta))
        return
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        setActive(
          event.key === 'Home' ? firstEnabledIndex(menu.entries) : lastEnabledIndex(menu.entries),
        )
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        const entry = menu.entries[active]
        if (entry?.kind !== 'item' || entry.disabled) return
        event.preventDefault()
        menu.onSelect(entry.action)
        onClose()
      }
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu, active, onClose])

  return (
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      aria-label={menu.title ?? t('ctx.menu')}
      data-guide="context-menu"
      className="fixed z-50 w-[220px] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-xs shadow-lg outline-none dark:border-neutral-700 dark:bg-neutral-900"
      style={{ left: position.x, top: position.y }}
    >
      {menu.entries.map((entry, index) =>
        entry.kind === 'separator' ? (
          <div key={entry.id} className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
        ) : (
          <button
            key={entry.action}
            type="button"
            role="menuitem"
            disabled={entry.disabled}
            onPointerEnter={() => setActive(index)}
            onClick={() => {
              menu.onSelect(entry.action)
              onClose()
            }}
            className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-start ${
              entry.disabled
                ? 'cursor-default text-neutral-300 dark:text-neutral-600'
                : index === active
                  ? entry.danger
                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : entry.danger
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-700 dark:text-neutral-200'
            }`}
          >
            <span className="truncate">{t(entry.labelKey)}</span>
            {entry.shortcut ? (
              <span className="shrink-0 text-[10px] text-neutral-400">{entry.shortcut}</span>
            ) : null}
          </button>
        ),
      )}
    </div>
  )
}
