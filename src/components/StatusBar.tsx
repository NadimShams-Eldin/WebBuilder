import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import { useI18n } from '../editor/useI18n.ts'
import { DEVICE_WIDTHS } from '../editor/viewport.ts'

export function StatusBar() {
  const { t } = useI18n()
  const selectedId = useEditorStore((s) => s.selectedId)
  const device = useEditorStore((s) => s.device)
  const zoom = useEditorStore((s) => s.zoom)
  const page = useEditorStore(selectActivePage)
  const node = page && selectedId ? findNode(page.root, selectedId) : null
  const activeWorkspaceId = useEditorStore((s) => s.activeWorkspaceId)
  const timelineOpen = useEditorStore((s) => s.timelineOpen)
  const playhead = useEditorStore((s) => s.playhead)
  const workspaceNameKey =
    activeWorkspaceId === 'custom' ? 'workspace.custom' : `workspace.${activeWorkspaceId}`

  return (
    <div className="flex items-center gap-3 border-t border-neutral-200 bg-white px-3 py-1 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      <span className="font-medium text-neutral-600 dark:text-neutral-300">{t('status.ready')}</span>
      <span className="text-neutral-300 dark:text-neutral-600">|</span>
      <span className="truncate">
        {t('status.selected')}:{' '}
        {node
          ? `${node.name} · ${t(`block.${node.type}`)}${node.componentId ? ` · ${t('comp.linked')}` : ''}`
          : t('status.noSelection')}
      </span>
      <div className="ms-auto flex items-center gap-3">
        {timelineOpen ? (
          <span>
            {t('tl.title')}: {playhead.toFixed(2)}
            {t('tl.seconds')}
          </span>
        ) : null}
        <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {t(workspaceNameKey)}
        </span>
        <span>
          {t('status.page')}: {page?.name ?? '—'}
        </span>
        <span>
          {t('status.device')}: {t(`device.${device}`)} {DEVICE_WIDTHS[device]}px
        </span>
        <span>
          {t('status.zoom')}: {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  )
}
