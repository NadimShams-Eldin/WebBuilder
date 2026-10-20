import { useEffect, useRef, useState } from 'react'
import { createProject } from '../editor/createProject.ts'
import { withoutDemoHref } from '../editor/demoMode.ts'
import { selectCanRedo, selectCanUndo, useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { useProjectIO } from './useProjectIO.ts'

type MenuItem =
  | { kind: 'action'; label: string; onSelect: () => void; disabled?: boolean; checked?: boolean }
  | { kind: 'separator' }

type MenuDef = { id: string; label: string; items: MenuItem[] }

function Logo() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded bg-neutral-900 text-[11px] font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
      ق
    </span>
  )
}

export function MenuBar() {
  const { t } = useI18n()
  const [open, setOpen] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore(selectCanUndo)
  const canRedo = useEditorStore(selectCanRedo)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const clearPage = useEditorStore((s) => s.clearPage)
  const loadDemo = useEditorStore((s) => s.loadDemo)
  const project = useEditorStore((s) => s.project)
  const setProject = useEditorStore((s) => s.setProject)
  const selectedId = useEditorStore((s) => s.selectedId)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const activePageId = useEditorStore((s) => s.activePageId)
  const theme = useEditorStore((s) => s.theme)
  const setTheme = useEditorStore((s) => s.setTheme)
  const locale = useEditorStore((s) => s.locale)
  const setLocale = useEditorStore((s) => s.setLocale)
  const panels = useEditorStore((s) => s.panels)
  const togglePanel = useEditorStore((s) => s.togglePanel)
  const gridOverlay = useEditorStore((s) => s.gridOverlay)
  const toggleGridOverlay = useEditorStore((s) => s.toggleGridOverlay)
  const timelineOpen = useEditorStore((s) => s.timelineOpen)
  const toggleTimeline = useEditorStore((s) => s.toggleTimeline)
  const setLeftTab = useEditorStore((s) => s.setLeftTab)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const setPanelVisible = useEditorStore((s) => s.setPanelVisible)
  const resetLayout = useEditorStore((s) => s.resetLayout)
  const workspace = useEditorStore((s) => s.workspace)
  const setWorkspace = useEditorStore((s) => s.setWorkspace)
  const setShortcutsOpen = useEditorStore((s) => s.setShortcutsOpen)
  const demoMode = useEditorStore((s) => s.demoMode)
  const density = useEditorStore((s) => s.density)
  const panelFontScale = useEditorStore((s) => s.panelFontScale)
  const activeWorkspaceId = useEditorStore((s) => s.activeWorkspaceId)
  const workspacePresets = useEditorStore((s) => s.workspacePresets)
  const applyWorkspace = useEditorStore((s) => s.applyWorkspace)
  const saveCustomWorkspace = useEditorStore((s) => s.saveCustomWorkspace)
  const setDensity = useEditorStore((s) => s.setDensity)
  const setPanelFontScale = useEditorStore((s) => s.setPanelFontScale)
  const io = useProjectIO()

  const preview = workspace === 'preview'
  const activePage = project.pages.find((page) => page.id === activePageId)
  const canDelete = Boolean(selectedId && activePage && selectedId !== activePage.root.id)
  const canClear = Boolean(activePage && activePage.root.children.length > 0)

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const menus: MenuDef[] = [
    {
      id: 'file',
      label: t('menu.file'),
      items: [
        { kind: 'action', label: t('menu.new'), onSelect: () => setProject(createProject()) },
        { kind: 'action', label: t('tools.demo'), onSelect: loadDemo },
        {
          kind: 'action',
          label: t('tools.demoDownload'),
          onSelect: () => {
            const link = document.createElement('a')
            link.href = 'demo/qitma-demo.json'
            link.download = 'qitma-demo.json'
            link.click()
          },
        },
        { kind: 'separator' },
        { kind: 'action', label: t('project.import'), onSelect: io.importProject },
        { kind: 'action', label: t('project.export'), onSelect: io.exportProject },
        { kind: 'action', label: t('project.exportSite'), onSelect: () => void io.exportSite() },
        { kind: 'action', label: t('project.publish'), onSelect: () => void io.publishSite() },
      ],
    },
    {
      id: 'edit',
      label: t('menu.edit'),
      items: [
        { kind: 'action', label: t('header.undo'), onSelect: undo, disabled: !canUndo },
        { kind: 'action', label: t('header.redo'), onSelect: redo, disabled: !canRedo },
        { kind: 'separator' },
        {
          kind: 'action',
          label: t('tools.duplicate'),
          onSelect: () => duplicateSelected(),
          disabled: !canDelete,
        },
        { kind: 'action', label: t('tools.delete'), onSelect: () => deleteSelected(), disabled: !canDelete },
        { kind: 'action', label: t('tools.clear'), onSelect: () => clearPage(), disabled: !canClear },
      ],
    },
    {
      id: 'pages',
      label: t('menu.pages'),
      items: [
        { kind: 'action', label: t('pages.add'), onSelect: () => addPage() },
        { kind: 'separator' },
        ...project.pages.map<MenuItem>((page) => ({
          kind: 'action',
          label: page.name,
          onSelect: () => setActivePage(page.id),
          checked: page.id === activePageId,
        })),
        ...(project.pages.length > 1
          ? ([
              { kind: 'separator' },
              {
                kind: 'action',
                label: t('pages.delete'),
                onSelect: () => removePage(activePageId ?? undefined),
              },
            ] as MenuItem[])
          : []),
      ],
    },
    {
      id: 'view',
      label: t('menu.view'),
      items: [
        {
          kind: 'action',
          label: t('menu.preview'),
          onSelect: () => setWorkspace('preview'),
          checked: preview,
        },
        {
          kind: 'action',
          label: t('menu.compose'),
          onSelect: () => setWorkspace('compose'),
          checked: !preview,
        },
        { kind: 'separator' },
        { kind: 'action', label: t('menu.gridOverlay'), onSelect: toggleGridOverlay, checked: gridOverlay },
        { kind: 'action', label: t('tl.open'), onSelect: toggleTimeline, checked: timelineOpen },
        {
          kind: 'action',
          label: t('command.openInteractions'),
          onSelect: () => {
            setPanelVisible('left', true)
            setLeftTab('interactions')
          },
        },
        {
          kind: 'action',
          label: t('command.openAssets'),
          onSelect: () => {
            setPanelVisible('right', true)
            setRightTab('assets')
          },
        },
      ],
    },
    {
      id: 'window',
      label: t('menu.window'),
      items: [
        {
          kind: 'action',
          label: t('menu.panelLeft'),
          onSelect: () => togglePanel('left'),
          checked: panels.left,
        },
        {
          kind: 'action',
          label: t('menu.panelRight'),
          onSelect: () => togglePanel('right'),
          checked: panels.right,
        },
        { kind: 'separator' },
        {
          kind: 'action',
          label: t('menu.toggleTheme'),
          onSelect: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        },
        {
          kind: 'action',
          label: t('menu.toggleLocale'),
          onSelect: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
        },
        { kind: 'separator' },
        ...workspacePresets().map(
          (preset): MenuItem => ({
            kind: 'action',
            label: t(preset.nameKey),
            onSelect: () => applyWorkspace(preset.id),
            checked: activeWorkspaceId === preset.id,
          }),
        ),
        { kind: 'action', label: t('menu.saveWorkspace'), onSelect: saveCustomWorkspace },
        { kind: 'separator' },
        {
          kind: 'action',
          label: `${t('menu.density')}: ${t('density.comfortable')}`,
          onSelect: () => setDensity('comfortable'),
          checked: density === 'comfortable',
        },
        {
          kind: 'action',
          label: `${t('menu.density')}: ${t('density.compact')}`,
          onSelect: () => setDensity('compact'),
          checked: density === 'compact',
        },
        { kind: 'separator' },
        ...(
          [
            ['small', 0.9],
            ['medium', 1],
            ['large', 1.1],
          ] as const
        ).map(
          ([key, scale]): MenuItem => ({
            kind: 'action',
            label: `${t('menu.fontScale')}: ${t(`fontScale.${key}`)}`,
            onSelect: () => setPanelFontScale(scale),
            checked: panelFontScale === scale,
          }),
        ),
        { kind: 'action', label: t('menu.resetLayout'), onSelect: resetLayout },
      ],
    },
    {
      id: 'help',
      label: t('menu.help'),
      items: [
        { kind: 'action', label: t('menu.shortcuts'), onSelect: () => setShortcutsOpen(true) },
        { kind: 'action', label: t('menu.about'), onSelect: () => setAboutOpen(true) },
      ],
    },
  ]

  return (
    <div
      ref={barRef}
      className="relative z-30 flex items-center gap-1 border-b border-neutral-200 bg-white px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Logo />
      <span className="me-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
        {t('app.name')}
      </span>
      {demoMode ? (
        <span className="me-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {t('demo.badge')}
          <button
            type="button"
            title={t('demo.exitHint')}
            className="rounded-full px-1.5 py-0.5 text-[10px] text-blue-700 underline underline-offset-2 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
            onClick={() => {
              const url = withoutDemoHref(window.location.href)
              window.location.replace(url)
            }}
          >
            {t('demo.exit')}
          </button>
        </span>
      ) : null}

      {menus.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            type="button"
            className={
              open === menu.id
                ? 'rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }
            onClick={() => setOpen(open === menu.id ? null : menu.id)}
            onMouseEnter={() => (open ? setOpen(menu.id) : undefined)}
          >
            {menu.label}
          </button>
          {open === menu.id ? (
            <div className="absolute start-0 mt-1 min-w-52 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
              {menu.items.map((item, index) =>
                item.kind === 'separator' ? (
                  <div key={`sep-${index}`} className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                ) : (
                  <button
                    key={`${menu.id}-${index}`}
                    type="button"
                    disabled={item.disabled}
                    className={
                      item.disabled
                        ? 'flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs text-neutral-300 dark:text-neutral-600'
                        : 'flex w-full items-center gap-2 px-3 py-1.5 text-start text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                    }
                    onClick={() => {
                      setOpen(null)
                      item.onSelect()
                    }}
                  >
                    <span className="w-3 text-blue-600 dark:text-blue-400">{item.checked ? '•' : ''}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                ),
              )}
            </div>
          ) : null}
        </div>
      ))}

      <div className="ms-auto flex items-center gap-2">
        <button
          type="button"
          className="rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          onClick={() => setWorkspace(preview ? 'compose' : 'preview')}
        >
          {preview ? t('menu.compose') : t('menu.preview')}
        </button>
        <button
          type="button"
          className="rounded border border-blue-600 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
          onClick={() => void io.publishSite()}
        >
          {t('header.publish')}
        </button>
      </div>

      {aboutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {t('menu.about')}
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              {t('menu.aboutText')}
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              onClick={() => setAboutOpen(false)}
            >
              {t('about.close')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
