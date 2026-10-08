import type { Project } from './types.ts'

export const HISTORY_LIMIT = 50
export const UPDATE_COALESCE_MS = 800

export type EditorSnapshot = {
  project: Project
  selectedId: string | null
  activePageId: string | null
}

export type HistoryState = {
  past: EditorSnapshot[]
  future: EditorSnapshot[]
}

export type CoalesceKind = 'update'

export type CoalesceState = {
  kind: CoalesceKind
  id: string
  at: number
} | null

export function emptyHistory(): HistoryState {
  return { past: [], future: [] }
}

export function snapshotOf(
  project: Project,
  selectedId: string | null,
  activePageId: string | null = project.pages[0]?.id ?? null,
): EditorSnapshot {
  return { project, selectedId, activePageId }
}

export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0
}

export function canRedo(history: HistoryState): boolean {
  return history.future.length > 0
}

export function pushHistory(history: HistoryState, current: EditorSnapshot): HistoryState {
  const past = [...history.past, current]
  if (past.length > HISTORY_LIMIT) {
    return { past: past.slice(past.length - HISTORY_LIMIT), future: [] }
  }
  return { past, future: [] }
}

export function undoHistory(
  history: HistoryState,
  current: EditorSnapshot,
): { history: HistoryState; snapshot: EditorSnapshot } | null {
  if (history.past.length === 0) return null
  const snapshot = history.past[history.past.length - 1]
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
    snapshot,
  }
}

export function redoHistory(
  history: HistoryState,
  current: EditorSnapshot,
): { history: HistoryState; snapshot: EditorSnapshot } | null {
  if (history.future.length === 0) return null
  const snapshot = history.future[0]
  return {
    history: {
      past: [...history.past, current],
      future: history.future.slice(1),
    },
    snapshot,
  }
}

export function shouldCoalesceUpdate(
  coalesce: CoalesceState,
  selectedId: string | null,
  now: number,
): boolean {
  return Boolean(
    coalesce &&
      coalesce.kind === 'update' &&
      selectedId &&
      coalesce.id === selectedId &&
      now - coalesce.at <= UPDATE_COALESCE_MS,
  )
}
