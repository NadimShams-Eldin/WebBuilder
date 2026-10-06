import { create } from 'zustand'
import { createDemoProject } from './demoProject.ts'
import {
  canRedo,
  canUndo,
  emptyHistory,
  pushHistory,
  redoHistory,
  shouldCoalesceUpdate,
  snapshotOf,
  undoHistory,
  type CoalesceState,
  type HistoryState,
} from './history.ts'
import {
  addNodeToProject,
  insertAtDropInProject,
  moveNodeInProject,
  updateNodeInProject,
  type DropIntent,
  type NodePatch,
} from './tree.ts'
import type { NodeType, Project } from './types.ts'

export type Device = 'desktop' | 'tablet' | 'phone'

export const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  phone: 390,
}

export type RightTab = 'blocks' | 'outline'

export type EditorState = {
  project: Project
  selectedId: string | null
  device: Device
  zoom: number
  lastInsertError: string | null
  rightTab: RightTab
  dropPreview: DropIntent | null
  history: HistoryState
  setProject: (project: Project) => void
  setSelectedId: (id: string | null) => void
  setDevice: (device: Device) => void
  setZoom: (zoom: number) => void
  setRightTab: (tab: RightTab) => void
  setDropPreview: (preview: DropIntent | null) => void
  addBlock: (type: NodeType) => boolean
  dropBlock: (type: NodeType, intent: DropIntent) => boolean
  moveNodeTo: (nodeId: string, intent: DropIntent) => boolean
  updateSelected: (patch: NodePatch) => void
  undo: () => boolean
  redo: () => boolean
}

let coalesce: CoalesceState = null

export const useEditorStore = create<EditorState>((set, get) => {
  const commit = (
    patch: { project: Project; selectedId?: string | null } & Record<string, unknown>,
    kind?: 'update',
  ) => {
    const state = get()
    const selectedId = patch.selectedId !== undefined ? patch.selectedId : state.selectedId
    const now = Date.now()
    const reuse = kind === 'update' && shouldCoalesceUpdate(coalesce, state.selectedId, now)
    const history = reuse
      ? state.history
      : pushHistory(state.history, snapshotOf(state.project, state.selectedId))
    coalesce =
      kind === 'update' && selectedId ? { kind: 'update', id: selectedId, at: now } : null
    set({ ...patch, selectedId, history })
  }

  return {
    project: createDemoProject(),
    selectedId: null,
    device: 'desktop',
    zoom: 1,
    lastInsertError: null,
    rightTab: 'blocks',
    dropPreview: null,
    history: emptyHistory(),
    setProject: (project) => {
      commit({ project, lastInsertError: null })
    },
    setSelectedId: (selectedId) => {
      coalesce = null
      set({ selectedId, lastInsertError: null })
    },
    setDevice: (device) => set({ device }),
    setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, zoom)) }),
    setRightTab: (rightTab) => set({ rightTab }),
    setDropPreview: (dropPreview) => set({ dropPreview }),
    addBlock: (type) => {
      const { project, selectedId } = get()
      const result = addNodeToProject(project, selectedId, type)
      if (!result) {
        set({ lastInsertError: 'لا يمكن إضافة عنصر هنا' })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
      })
      return true
    },
    dropBlock: (type, intent) => {
      const { project } = get()
      const result = insertAtDropInProject(project, type, intent)
      if (!result) {
        set({ lastInsertError: 'لا يمكن الإفلات هنا', dropPreview: null })
        return false
      }
      commit({
        project: result.project,
        selectedId: result.node.id,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    moveNodeTo: (nodeId, intent) => {
      const { project } = get()
      const next = moveNodeInProject(project, nodeId, intent)
      if (!next) {
        set({ lastInsertError: 'لا يمكن نقل العنصر إلى هنا', dropPreview: null })
        return false
      }
      commit({
        project: next,
        selectedId: nodeId,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    updateSelected: (patch) => {
      const { project, selectedId } = get()
      if (!selectedId) return
      const next = updateNodeInProject(project, selectedId, patch)
      if (next) commit({ project: next }, 'update')
    },
    undo: () => {
      const state = get()
      const result = undoHistory(state.history, snapshotOf(state.project, state.selectedId))
      if (!result) return false
      coalesce = null
      set({
        project: result.snapshot.project,
        selectedId: result.snapshot.selectedId,
        history: result.history,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
    redo: () => {
      const state = get()
      const result = redoHistory(state.history, snapshotOf(state.project, state.selectedId))
      if (!result) return false
      coalesce = null
      set({
        project: result.snapshot.project,
        selectedId: result.snapshot.selectedId,
        history: result.history,
        lastInsertError: null,
        dropPreview: null,
      })
      return true
    },
  }
})

export function getActivePage(project: Project) {
  return project.pages[0]
}

export function selectCanUndo(state: EditorState): boolean {
  return canUndo(state.history)
}

export function selectCanRedo(state: EditorState): boolean {
  return canRedo(state.history)
}
