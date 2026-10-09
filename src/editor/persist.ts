import { sanitizeProject } from './projectJson.ts'
import type { Project } from './types.ts'

export const PROJECT_STORAGE_KEY = 'qitma-project'

export type PersistedSession = {
  project: Project
  activePageId: string | null
}

export function serializeSession(session: PersistedSession): string {
  return JSON.stringify({
    project: session.project,
    activePageId: session.activePageId,
  })
}

export function parsePersistedSession(raw: string | null): PersistedSession | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { project?: unknown; activePageId?: unknown }
    const project = sanitizeProject(parsed.project ?? parsed)
    if (!project) return null
    const activePageId =
      typeof parsed.activePageId === 'string' &&
      project.pages.some((page) => page.id === parsed.activePageId)
        ? parsed.activePageId
        : (project.pages[0]?.id ?? null)
    return { project, activePageId }
  } catch {
    return null
  }
}

export function loadPersistedSession(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): PersistedSession | null {
  if (!storage) return null
  try {
    return parsePersistedSession(storage.getItem(PROJECT_STORAGE_KEY))
  } catch {
    return null
  }
}

export function savePersistedSession(
  session: PersistedSession,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(PROJECT_STORAGE_KEY, serializeSession(session))
    return true
  } catch {
    return false
  }
}

export function clearPersistedSession(
  storage: Pick<Storage, 'removeItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return
  try {
    storage.removeItem(PROJECT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
