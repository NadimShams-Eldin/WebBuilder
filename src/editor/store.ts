import { create } from 'zustand'
import { createDemoProject } from './demoProject.ts'
import { addNodeToProject } from './tree.ts'
import type { NodeType, Project } from './types.ts'

export type Device = 'desktop' | 'tablet' | 'phone'

export const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  phone: 390,
}

export type EditorState = {
  project: Project
  selectedId: string | null
  device: Device
  zoom: number
  lastInsertError: string | null
  setProject: (project: Project) => void
  setSelectedId: (id: string | null) => void
  setDevice: (device: Device) => void
  setZoom: (zoom: number) => void
  addBlock: (type: NodeType) => boolean
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createDemoProject(),
  selectedId: null,
  device: 'desktop',
  zoom: 1,
  lastInsertError: null,
  setProject: (project) => set({ project }),
  setSelectedId: (selectedId) => set({ selectedId, lastInsertError: null }),
  setDevice: (device) => set({ device }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, zoom)) }),
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
}))

export function getActivePage(project: Project) {
  return project.pages[0]
}
