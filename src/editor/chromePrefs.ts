export type EditorTheme = 'light' | 'dark'
export type Locale = 'ar' | 'en'

export const CHROME_STORAGE_KEY = 'qitma-chrome'

export type ChromePrefs = {
  theme: EditorTheme
  locale: Locale
}

export const DEFAULT_CHROME: ChromePrefs = {
  theme: 'light',
  locale: 'ar',
}

export function isEditorTheme(value: unknown): value is EditorTheme {
  return value === 'light' || value === 'dark'
}

export function isLocale(value: unknown): value is Locale {
  return value === 'ar' || value === 'en'
}

export function parseChromePrefs(raw: string | null): ChromePrefs {
  if (!raw) return { ...DEFAULT_CHROME }
  try {
    const parsed = JSON.parse(raw) as { theme?: unknown; locale?: unknown }
    return {
      theme: isEditorTheme(parsed.theme) ? parsed.theme : DEFAULT_CHROME.theme,
      locale: isLocale(parsed.locale) ? parsed.locale : DEFAULT_CHROME.locale,
    }
  } catch {
    return { ...DEFAULT_CHROME }
  }
}

export function serializeChromePrefs(prefs: ChromePrefs): string {
  return JSON.stringify({ theme: prefs.theme, locale: prefs.locale })
}

export function loadChromePrefs(
  storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): ChromePrefs {
  if (!storage) return { ...DEFAULT_CHROME }
  try {
    return parseChromePrefs(storage.getItem(CHROME_STORAGE_KEY))
  } catch {
    return { ...DEFAULT_CHROME }
  }
}

export function saveChromePrefs(
  prefs: ChromePrefs,
  storage: Pick<Storage, 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage,
): void {
  if (!storage) return
  try {
    storage.setItem(CHROME_STORAGE_KEY, serializeChromePrefs(prefs))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function localeDir(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}
