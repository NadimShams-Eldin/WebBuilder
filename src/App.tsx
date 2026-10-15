import { useEffect } from 'react'
import { Breadcrumb } from './components/Breadcrumb'
import { CanvasArea } from './components/CanvasArea'
import { EditorDnd } from './components/EditorDnd'
import { LeftPanel } from './components/LeftPanel'
import { MenuBar } from './components/MenuBar'
import { PageTabs } from './components/PageTabs'
import { PanelCollapseStrip, PanelResizer } from './components/PanelResizer'
import { RightPanel } from './components/RightPanel'
import { StatusBar } from './components/StatusBar'
import { Toolbar } from './components/Toolbar'
import { localeDir } from './editor/chromePrefs.ts'
import { useEditorStore } from './editor/store.ts'

export default function App() {
  const theme = useEditorStore((s) => s.theme)
  const locale = useEditorStore((s) => s.locale)
  const workspace = useEditorStore((s) => s.workspace)
  const panels = useEditorStore((s) => s.panels)
  const preview = workspace === 'preview'
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
        <MenuBar />
        {preview ? null : <Toolbar />}
        <div className="flex min-h-0 flex-1">
          {preview ? null : panels.right ? (
            <>
              <RightPanel />
              <PanelResizer panel="right" />
            </>
          ) : (
            <PanelCollapseStrip panel="right" />
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            {preview ? null : <PageTabs />}
            <CanvasArea />
            {preview ? null : <Breadcrumb />}
          </div>
          {preview ? null : panels.left ? (
            <>
              <PanelResizer panel="left" />
              <LeftPanel />
            </>
          ) : (
            <PanelCollapseStrip panel="left" />
          )}
        </div>
        {preview ? null : <StatusBar />}
      </div>
    </EditorDnd>
  )
}
