export type Device = 'desktop' | 'tablet' | 'phone'

export const DEVICES: readonly Device[] = ['desktop', 'tablet', 'phone']

export const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  phone: 390,
}

export const DEVICE_LABELS: Record<Device, string> = {
  desktop: 'حاسوب',
  tablet: 'لوحي',
  phone: 'هاتف',
}

export const VIEWPORT_STORAGE_KEY = 'qitma-viewport'
export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 1.5
export const ZOOM_STEP = 0.1
export const ZOOM_DEFAULT = 1

export type ViewportPrefs = {
  device: Device
  zoom: number
}

export function isDevice(value: unknown): value is Device {
  return value === 'desktop' || value === 'tablet' || value === 'phone'
}

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT
  const snapped = Math.round(value / ZOOM_STEP) * ZOOM_STEP
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, snapped))
  return Math.round(clamped * 10) / 10
}

export function parseViewportPrefs(raw: string | null): ViewportPrefs {
  if (!raw) return { device: 'desktop', zoom: ZOOM_DEFAULT }
  try {
    const parsed = JSON.parse(raw) as { device?: unknown; zoom?: unknown }
    return {
      device: isDevice(parsed.device) ? parsed.device : 'desktop',
      zoom: typeof parsed.zoom === 'number' ? clampZoom(parsed.zoom) : ZOOM_DEFAULT,
    }
  } catch {
    return { device: 'desktop', zoom: ZOOM_DEFAULT }
  }
}

export function serializeViewportPrefs(prefs: ViewportPrefs): string {
  return JSON.stringify({ device: prefs.device, zoom: clampZoom(prefs.zoom) })
}

export function loadViewportPrefs(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): ViewportPrefs {
  if (!storage) return { device: 'desktop', zoom: ZOOM_DEFAULT }
  try {
    return parseViewportPrefs(storage.getItem(VIEWPORT_STORAGE_KEY))
  } catch {
    return { device: 'desktop', zoom: ZOOM_DEFAULT }
  }
}

export function saveViewportPrefs(
  prefs: ViewportPrefs,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return
  try {
    storage.setItem(VIEWPORT_STORAGE_KEY, serializeViewportPrefs(prefs))
  } catch {
    /* ignore quota / private-mode errors */
  }
}
