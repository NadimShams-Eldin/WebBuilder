import { translate } from './i18n.ts'
import { useEditorStore } from './store.ts'

export function useI18n() {
  const locale = useEditorStore((s) => s.locale)
  return {
    locale,
    t: (key: string) => translate(locale, key),
  }
}
