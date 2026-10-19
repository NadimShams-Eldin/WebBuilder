import { useCallback, useState } from 'react'
import { buildContextMenu, type ContextAction } from '../editor/contextMenu.ts'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import type { NodeType } from '../editor/types.ts'
import { useI18n } from '../editor/useI18n.ts'
import type { ContextMenuState } from './ContextMenu'

const WRAP_ACTIONS: Partial<Record<ContextAction, NodeType>> = {
  'wrap-container': 'container',
  'wrap-flex': 'flex',
  'wrap-grid': 'grid',
}

export function useNodeContextMenu() {
  const { t } = useI18n()
  const page = useEditorStore(selectActivePage)
  const styleClipboard = useEditorStore((s) => s.styleClipboard)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected)
  const deleteSelected = useEditorStore((s) => s.deleteSelected)
  const wrapSelected = useEditorStore((s) => s.wrapSelected)
  const copySelectedStyle = useEditorStore((s) => s.copySelectedStyle)
  const pasteStyleToSelected = useEditorStore((s) => s.pasteStyleToSelected)
  const selectParentOfSelected = useEditorStore((s) => s.selectParentOfSelected)
  const selectFirstChildOfSelected = useEditorStore((s) => s.selectFirstChildOfSelected)
  const setLeftTab = useEditorStore((s) => s.setLeftTab)
  const setPanelVisible = useEditorStore((s) => s.setPanelVisible)
  const setRightTab = useEditorStore((s) => s.setRightTab)
  const createComponentFromSelected = useEditorStore((s) => s.createComponentFromSelected)
  const detachSelectedComponent = useEditorStore((s) => s.detachSelectedComponent)
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const openMenu = useCallback(
    (id: string | null, x: number, y: number) => {
      if (!page) return
      const target = id ? findNode(page.root, id) : null
      if (!target) return
      setSelectedId(target.id)
      const isRoot = target.id === page.root.id

      const run = (action: ContextAction) => {
        if (action === 'open-properties') {
          setLeftTab('style')
          setPanelVisible('left', true)
          return
        }
        if (action === 'copy-style') {
          copySelectedStyle()
          return
        }
        if (action === 'paste-style') {
          pasteStyleToSelected()
          return
        }
        if (isRoot) return
        if (action === 'duplicate') {
          duplicateSelected()
          return
        }
        if (action === 'delete') {
          deleteSelected()
          return
        }
        if (action === 'select-parent') {
          selectParentOfSelected()
          return
        }
        if (action === 'select-child') {
          selectFirstChildOfSelected()
          return
        }
        if (action === 'save-component') {
          const name = window.prompt(t('comp.promptName'))
          if (name === null) return
          if (createComponentFromSelected(name)) setRightTab('components')
          return
        }
        if (action === 'detach-component') {
          detachSelectedComponent()
          return
        }
        const wrap = WRAP_ACTIONS[action]
        if (wrap) wrapSelected(wrap)
      }

      setMenu({
        x,
        y,
        title: target.name,
        entries: buildContextMenu({
          isRoot,
          hasChildren: target.children.length > 0,
          hasStyleClipboard: Boolean(styleClipboard),
          isInstance: Boolean(target.componentId),
        }),
        onSelect: run,
      })
    },
    [
      page,
      styleClipboard,
      setSelectedId,
      duplicateSelected,
      deleteSelected,
      wrapSelected,
      copySelectedStyle,
      pasteStyleToSelected,
      selectParentOfSelected,
      selectFirstChildOfSelected,
      setLeftTab,
      setPanelVisible,
      setRightTab,
      createComponentFromSelected,
      detachSelectedComponent,
      t,
    ],
  )

  const closeMenu = useCallback(() => setMenu(null), [])

  return { menu, openMenu, closeMenu }
}
