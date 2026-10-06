import { AppHeader } from './components/AppHeader'
import { CanvasArea } from './components/CanvasArea'
import { EditorDnd } from './components/EditorDnd'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'

export default function App() {
  return (
    <EditorDnd>
      <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900">
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
