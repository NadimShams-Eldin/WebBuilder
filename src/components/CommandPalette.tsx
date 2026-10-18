import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { localeDir } from '../editor/chromePrefs.ts'
import { filterCommands, nextCommandIndex, type CommandItem } from '../editor/commands.ts'
import { NODE_TYPES } from '../editor/types.ts'
import { useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { useProjectIO } from './useProjectIO.ts'

type Command = CommandItem & { run: () => void }

export function CommandPalette() {
  const open = useEditorStore((s) => s.paletteOpen)
  const setOpen = useEditorStore((s) => s.setPaletteOpen)
  if (!open) return null
  return <PaletteDialog onClose={() => setOpen(false)} />
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const io = useProjectIO()
  const addBlock = useEditorStore((s) => s.addBlock)
  const addPage = useEditorStore((s) => s.addPage)
  const togglePanel = useEditorStore((s) => s.togglePanel)
  const toggleGridOverlay = useEditorStore((s) => s.toggleGridOverlay)
  const setWorkspace = useEditorStore((s) => s.setWorkspace)
  const setZoom = useEditorStore((s) => s.setZoom)
  const locale = useEditorStore((s) => s.locale)
  const applyWorkspace = useEditorStore((s) => s.applyWorkspace)
  const saveCustomWorkspace = useEditorStore((s) => s.saveCustomWorkspace)
  const workspacePresets = useEditorStore((s) => s.workspacePresets)
  const setDensity = useEditorStore((s) => s.setDensity)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const commands = useMemo<Command[]>(() => {
    const insertCommands: Command[] = NODE_TYPES.map((type) => ({
      id: `insert:${type}`,
      label: t(`block.${type}`),
      group: t('palette.group.insert'),
      keywords: [type],
      run: () => addBlock(type),
    }))
    const viewCommands: Command[] = [
      {
        id: 'view:preview',
        label: t('menu.preview'),
        group: t('palette.group.view'),
        keywords: ['preview', 'معاينة'],
        run: () => setWorkspace('preview'),
      },
      {
        id: 'view:left',
        label: t('command.toggleLeft'),
        group: t('palette.group.view'),
        keywords: ['panel', 'properties', 'style'],
        run: () => togglePanel('left'),
      },
      {
        id: 'view:right',
        label: t('command.toggleRight'),
        group: t('palette.group.view'),
        keywords: ['panel', 'blocks', 'outline'],
        run: () => togglePanel('right'),
      },
      {
        id: 'view:grid',
        label: t('command.toggleGrid'),
        group: t('palette.group.view'),
        keywords: ['grid', 'overlay', 'guides'],
        run: () => toggleGridOverlay(),
      },
      {
        id: 'view:zoom-reset',
        label: t('command.resetZoom'),
        group: t('palette.group.view'),
        shortcut: 'Ctrl+0',
        keywords: ['zoom', 'reset'],
        run: () => setZoom(1),
      },
    ]
    const pageCommands: Command[] = [
      {
        id: 'page:add',
        label: t('command.addPage'),
        group: t('palette.group.page'),
        keywords: ['page', 'new'],
        run: () => addPage(),
      },
    ]
    const projectCommands: Command[] = [
      {
        id: 'project:import',
        label: t('command.import'),
        group: t('palette.group.project'),
        keywords: ['import', 'json'],
        run: () => io.importProject(),
      },
      {
        id: 'project:export',
        label: t('command.export'),
        group: t('palette.group.project'),
        keywords: ['export', 'json', 'download'],
        run: () => io.exportProject(),
      },
      {
        id: 'project:export-site',
        label: t('command.exportSite'),
        group: t('palette.group.project'),
        keywords: ['export', 'zip', 'site', 'html'],
        run: () => void io.exportSite(),
      },
    ]

    const workspaceCommands: Command[] = [
      ...workspacePresets().map((preset) => ({
        id: `workspace:${preset.id}`,
        label: t(preset.nameKey),
        group: t('palette.group.workspace'),
        keywords: ['workspace', 'layout', 'مساحة'],
        run: () => applyWorkspace(preset.id),
      })),
      {
        id: 'workspace:save',
        label: t('menu.saveWorkspace'),
        group: t('palette.group.workspace'),
        keywords: ['workspace', 'save', 'layout', 'حفظ'],
        run: () => saveCustomWorkspace(),
      },
      {
        id: 'workspace:density-compact',
        label: `${t('menu.density')}: ${t('density.compact')}`,
        group: t('palette.group.workspace'),
        keywords: ['density', 'compact', 'كثافة'],
        run: () => setDensity('compact'),
      },
      {
        id: 'workspace:density-comfortable',
        label: `${t('menu.density')}: ${t('density.comfortable')}`,
        group: t('palette.group.workspace'),
        keywords: ['density', 'comfortable', 'كثافة'],
        run: () => setDensity('comfortable'),
      },
    ]

    return [
      ...insertCommands,
      ...viewCommands,
      ...pageCommands,
      ...projectCommands,
      ...workspaceCommands,
    ].map((command) => ({ ...command, run: () => (command.run(), onClose()) }))
  }, [
    addBlock,
    addPage,
    applyWorkspace,
    io,
    onClose,
    saveCustomWorkspace,
    setDensity,
    setZoom,
    setWorkspace,
    t,
    toggleGridOverlay,
    togglePanel,
    workspacePresets,
  ])

  const visible = useMemo(() => filterCommands(commands, query), [commands, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const item = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const runAt = (index: number) => {
    const command = visible[index]
    if (!command || command.disabled) return
    command.run()
  }

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) =>
        nextCommandIndex(visible, current, event.key === 'ArrowDown' ? 1 : -1),
      )
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      runAt(active)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/40 p-4 pt-[12vh] backdrop-blur-sm"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={localeDir(locale)}
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h2 id={titleId} className="sr-only">
          {t('palette.title')}
        </h2>
        <div className="border-b border-neutral-200 p-2 dark:border-neutral-700">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-1" role="listbox">
          {visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-neutral-500">{t('palette.empty')}</p>
          ) : (
            visible.map((command, index) => (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={index === active}
                data-index={index}
                disabled={command.disabled}
                onPointerEnter={() => setActive(index)}
                onClick={() => runAt(index)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm ${
                  index === active
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'text-neutral-700 dark:text-neutral-200'
                } disabled:opacity-40`}
              >
                <span className="flex-1 truncate">{command.label}</span>
                {command.group ? (
                  <span
                    className={`shrink-0 text-[11px] ${
                      index === active
                        ? 'text-white/70 dark:text-neutral-900/60'
                        : 'text-neutral-400'
                    }`}
                  >
                    {command.group}
                  </span>
                ) : null}
                {command.shortcut ? (
                  <kbd
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[11px] ${
                      index === active
                        ? 'border-white/40 text-white/80 dark:border-neutral-900/40 dark:text-neutral-900/70'
                        : 'border-neutral-300 text-neutral-500 dark:border-neutral-600'
                    }`}
                  >
                    {command.shortcut}
                  </kbd>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
