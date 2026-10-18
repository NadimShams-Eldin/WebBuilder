import { useEffect } from 'react'
import { resolveShortcut } from '../editor/shortcuts.ts'
import { useEditorStore } from '../editor/store.ts'
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '../editor/viewport.ts'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useEditorShortcuts() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return
      const action = resolveShortcut(event)
      if (!action) return
      const state = useEditorStore.getState()

      if (action === 'command-palette') {
        event.preventDefault()
        state.setPaletteOpen(!state.paletteOpen)
        return
      }
      if (action === 'shortcuts') {
        event.preventDefault()
        state.setShortcutsOpen(true)
        return
      }
      if (state.paletteOpen || state.shortcutsOpen) return

      if (state.workspace === 'preview') {
        if (action !== 'exit-preview' && action !== 'toggle-preview') return
        event.preventDefault()
        state.setWorkspace('compose')
        return
      }

      const page = state.project.pages.find((item) => item.id === state.activePageId)
      const canMutate = Boolean(state.selectedId && page && state.selectedId !== page.root.id)

      switch (action) {
        case 'undo':
          event.preventDefault()
          state.undo()
          break
        case 'redo':
          event.preventDefault()
          state.redo()
          break
        case 'duplicate':
          if (!canMutate) return
          event.preventDefault()
          state.duplicateSelected()
          break
        case 'delete':
          if (!canMutate) return
          event.preventDefault()
          state.deleteSelected()
          break
        case 'copy-style':
          event.preventDefault()
          state.copySelectedStyle()
          break
        case 'paste-style':
          if (!state.styleClipboard) return
          event.preventDefault()
          state.pasteStyleToSelected()
          break
        case 'zoom-in':
          event.preventDefault()
          state.setZoom(Math.min(ZOOM_MAX, state.zoom + ZOOM_STEP))
          break
        case 'zoom-out':
          event.preventDefault()
          state.setZoom(Math.max(ZOOM_MIN, state.zoom - ZOOM_STEP))
          break
        case 'zoom-reset':
          event.preventDefault()
          state.setZoom(1)
          break
        case 'toggle-preview':
          event.preventDefault()
          state.setWorkspace('preview')
          break
        case 'exit-preview':
          return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
