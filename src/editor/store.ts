import { create } from 'zustand'
import { createDemoProject } from './demoProject.ts'
import type { Project } from './types.ts'

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
  setProject: (project: Project) => void
  setSelectedId: (id: string | null) => void
  setDevice: (device: Device) => void
  setZoom: (zoom: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  project: createDemoProject(),
  selectedId: null,
  device: 'desktop',
  zoom: 1,
  setProject: (project) => set({ project }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setDevice: (device) => set({ device }),
  setZoom: (zoom) => set({ zoom: Math.min(1.5, Math.max(0.5, zoom)) }),
}))

export function getActivePage(project: Project) {
  return project.pages[0]
}
