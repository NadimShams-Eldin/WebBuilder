import { useEffect } from 'react'
import { AppHeader } from './components/AppHeader'
import { CanvasArea } from './components/CanvasArea'
import { EditorDnd } from './components/EditorDnd'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { localeDir } from './editor/chromePrefs.ts'
import { useEditorStore } from './editor/store.ts'

export default function App() {
  const theme = useEditorStore((s) => s.theme)
  const locale = useEditorStore((s) => s.locale)
  const dir = localeDir(locale)

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dir
    root.classList.toggle('dark', theme === 'dark')
  }, [theme, locale, dir])

  return (
    <EditorDnd>
      <div
        dir={dir}
        className="flex h-screen flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
      >
        <AppHeader />
        <div className="flex min-h-0 flex-1">
          <RightPanel />
          <CanvasArea />
          <LeftPanel />
        </div>
      </div>
    </EditorDnd>
  )
}
