import type { ReactNode } from 'react'
import { selectCanRedo, selectCanUndo, useEditorStore } from '../editor/store.ts'
import { useI18n } from '../editor/useI18n.ts'
import { DEVICE_WIDTHS, DEVICES, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../editor/viewport.ts'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const undoIcon = <Icon><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-4" /></Icon>
const redoIcon = <Icon><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h4" /></Icon>
const duplicateIcon = (
  <Icon>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2" />
  </Icon>
)
const deleteIcon = (
  <Icon>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Icon>
)
const clearIcon = <Icon><path d="M4 20h16" /><path d="m7 16 9-9a2 2 0 0 1 3 3l-9 9H7z" /></Icon>
const gridIcon = (
  <Icon>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
  </Icon>
)
const panelLeftIcon = <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></Icon>
const panelRightIcon = <Icon><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></Icon>
const timelineIcon = (
  <Icon>
    <path d="M4 6h16M4 12h16M4 18h10" />
    <circle cx="8" cy="6" r="1.4" fill="currentColor" />
    <circle cx="14" cy="12" r="1.4" fill="currentColor" />
    <circle cx="10" cy="18" r="1.4" fill="currentColor" />
  </Icon>
)
const previewIcon = (
  <Icon>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)
const minusIcon = <Icon><path d="M5 12h14" /></Icon>
const plusIcon = <Icon><path d="M12 5v14M5 12h14" /></Icon>
const leftIcon = <Icon><path d="m15 18-6-6 6-6" /></Icon>
const rightIcon = <Icon><path d="m9 18 6-6-6-6" /></Icon>
const themeIcon = (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)
const localeIcon = (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </Icon>
)

function ToolButton({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: ReactNode
}) {
  const tone = disabled
    ? 'text-neutral-300 dark:text-neutral-600'
    : active
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-7 items-center justify-center rounded-md px-1.5 ${tone}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
}

export function Toolbar() {
  const { t } = useI18n()
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore(selectCanUndo)
  const canRedo = useEditorStore(selectCanRedo)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const clearPage = useEditorStore((s) => s.clearPage)
  const selectedId = useEditorStore((s) => s.selectedId)
  const page = useEditorStore((s) => s.project.pages.find((p) => p.id === s.activePageId))
  const device = useEditorStore((s) => s.device)
  const setDevice = useEditorStore((s) => s.setDevice)
  const zoom = useEditorStore((s) => s.zoom)
  const setZoom = useEditorStore((s) => s.setZoom)
  const panels = useEditorStore((s) => s.panels)
  const togglePanel = useEditorStore((s) => s.togglePanel)
  const gridOverlay = useEditorStore((s) => s.gridOverlay)
  const toggleGridOverlay = useEditorStore((s) => s.toggleGridOverlay)
  const timelineOpen = useEditorStore((s) => s.timelineOpen)
  const toggleTimeline = useEditorStore((s) => s.toggleTimeline)
  const workspace = useEditorStore((s) => s.workspace)
  const setWorkspace = useEditorStore((s) => s.setWorkspace)
  const theme = useEditorStore((s) => s.theme)
  const setTheme = useEditorStore((s) => s.setTheme)
  const locale = useEditorStore((s) => s.locale)
  const setLocale = useEditorStore((s) => s.setLocale)
  const preview = workspace === 'preview'

  const canDelete = Boolean(selectedId && page && selectedId !== page.root.id)
  const canClear = Boolean(page && page.root.children.length > 0)
  const deviceIndex = DEVICES.indexOf(device)
  const prevDevice = DEVICES[Math.max(0, deviceIndex - 1)]
  const nextDevice = DEVICES[Math.min(DEVICES.length - 1, deviceIndex + 1)]

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-white px-2 py-1 dark:border-neutral-800 dark:bg-neutral-900">
      <ToolButton title={t('header.undo')} onClick={undo} disabled={!canUndo}>
        {undoIcon}
      </ToolButton>
      <ToolButton title={t('header.redo')} onClick={redo} disabled={!canRedo}>
        {redoIcon}
      </ToolButton>
      <Divider />
      <ToolButton title={t('tools.duplicate')} onClick={() => duplicateSelected()} disabled={!canDelete}>
        {duplicateIcon}
      </ToolButton>
      <ToolButton title={t('tools.delete')} onClick={() => deleteSelected()} disabled={!canDelete}>
        {deleteIcon}
      </ToolButton>
      <ToolButton title={t('tools.clear')} onClick={() => clearPage()} disabled={!canClear}>
        {clearIcon}
      </ToolButton>
      <Divider />
      <ToolButton title={t(`device.${prevDevice}`)} onClick={() => setDevice(prevDevice)} disabled={deviceIndex === 0}>
        {leftIcon}
      </ToolButton>
      <span className="min-w-20 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {t(`device.${device}`)} · {DEVICE_WIDTHS[device]}px
      </span>
      <ToolButton
        title={t(`device.${nextDevice}`)}
        onClick={() => setDevice(nextDevice)}
        disabled={deviceIndex === DEVICES.length - 1}
      >
        {rightIcon}
      </ToolButton>
      <Divider />
      <ToolButton title={t('zoom.out')} onClick={() => setZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN}>
        {minusIcon}
      </ToolButton>
      <button
        type="button"
        title={t('zoom.reset')}
        onClick={() => setZoom(1)}
        className="min-w-10 rounded px-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolButton title={t('zoom.in')} onClick={() => setZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX}>
        {plusIcon}
      </ToolButton>
      <Divider />
      <ToolButton title={t('menu.gridOverlay')} onClick={toggleGridOverlay} active={gridOverlay}>
        {gridIcon}
      </ToolButton>
      <ToolButton title={t('tl.open')} onClick={toggleTimeline} active={timelineOpen}>
        {timelineIcon}
      </ToolButton>
      <ToolButton title={t('menu.panelLeft')} onClick={() => togglePanel('left')} active={panels.left}>
        {panelLeftIcon}
      </ToolButton>
      <ToolButton title={t('menu.panelRight')} onClick={() => togglePanel('right')} active={panels.right}>
        {panelRightIcon}
      </ToolButton>
      <div className="ms-auto flex items-center gap-1">
        <ToolButton
          title={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {themeIcon}
        </ToolButton>
        <ToolButton
          title={locale === 'ar' ? 'English' : 'عربي'}
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
        >
          {localeIcon}
        </ToolButton>
        <ToolButton
          title={preview ? t('menu.compose') : t('menu.preview')}
          onClick={() => setWorkspace(preview ? 'compose' : 'preview')}
          active={preview}
        >
          {previewIcon}
        </ToolButton>
      </div>
    </div>
  )
}
