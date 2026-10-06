import { create } from 'zustand'
import { createDemoProject } from './demoProject.ts'
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
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createDemoProject(),
  selectedId: null,
  device: 'desktop',
  zoom: 1,
  lastInsertError: null,
  rightTab: 'blocks',
  dropPreview: null,
  setProject: (project) => set({ project }),
  setSelectedId: (selectedId) => set({ selectedId, lastInsertError: null }),
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
    set({
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
    set({
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
    set({
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
    if (next) set({ project: next })
  },
}))

export function getActivePage(project: Project) {
  return project.pages[0]
}
