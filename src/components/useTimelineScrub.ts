import { useEffect } from 'react'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { collectTimelineTracks, scrubStyle } from '../editor/timeline.ts'
import type { NodeAnimation } from '../editor/types.ts'

function clearScrub(el: HTMLElement) {
  el.style.removeProperty('opacity')
  el.style.removeProperty('transform')
  el.style.removeProperty('animation')
  el.style.removeProperty('transition')
}

function applyScrub(el: HTMLElement, animation: NodeAnimation, playhead: number) {
  const pose = scrubStyle(animation, playhead)
  el.style.setProperty('animation', 'none', 'important')
  el.style.setProperty('transition', 'none', 'important')
  el.style.setProperty('opacity', String(pose.opacity), 'important')
  el.style.setProperty('transform', pose.transform, 'important')
}

export function useTimelineScrub(iframe: HTMLIFrameElement | null) {
  const open = useEditorStore((s) => s.timelineOpen)
  const playhead = useEditorStore((s) => s.playhead)
  const page = useEditorStore(selectActivePage)
  const workspace = useEditorStore((s) => s.workspace)

  useEffect(() => {
    if (!iframe) return

    const apply = () => {
      const doc = iframe.contentDocument
      if (!doc || !page) return
      const tracks = collectTimelineTracks(page.root)
      const active = open && workspace !== 'preview'
      for (const track of tracks) {
        const el = doc.querySelector(`[data-qid="${CSS.escape(track.id)}"]`)
        if (!(el instanceof HTMLElement)) continue
        if (!active) {
          clearScrub(el)
          continue
        }
        applyScrub(el, track.animation, playhead)
      }
    }

    apply()
    iframe.addEventListener('load', apply)
    return () => iframe.removeEventListener('load', apply)
  }, [iframe, open, playhead, page, workspace])
}
