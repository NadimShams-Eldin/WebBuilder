import { useEffect, type CSSProperties } from 'react'
import { Breadcrumb } from './components/Breadcrumb'
import { CanvasArea } from './components/CanvasArea'
import { CommandPalette } from './components/CommandPalette'
import { EditorDnd } from './components/EditorDnd'
import { LeftPanel } from './components/LeftPanel'
import { MenuBar } from './components/MenuBar'
import { PageTabs } from './components/PageTabs'
import { PanelCollapseStrip, PanelResizer } from './components/PanelResizer'
import { RightPanel } from './components/RightPanel'
import { PublishDialog } from './components/PublishDialog'
import { ShortcutsDialog } from './components/ShortcutsDialog'
import { StatusBar } from './components/StatusBar'
import { Timeline } from './components/Timeline'
import { Toolbar } from './components/Toolbar'
import { useEditorShortcuts } from './components/useEditorShortcuts'
import { localeDir } from './editor/chromePrefs.ts'
import { useEditorStore } from './editor/store.ts'

export default function App() {
  useEditorShortcuts()
  const theme = useEditorStore((s) => s.theme)
  const locale = useEditorStore((s) => s.locale)
  const workspace = useEditorStore((s) => s.workspace)
  const panels = useEditorStore((s) => s.panels)
  const density = useEditorStore((s) => s.density)
  const panelFontScale = useEditorStore((s) => s.panelFontScale)
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
        data-density={density}
        style={{ '--q-panel-font-scale': panelFontScale } as CSSProperties}
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
            {preview ? null : <Timeline />}
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
        <CommandPalette />
        <ShortcutsDialog />
        <PublishDialog />
      </div>
    </EditorDnd>
  )
}
