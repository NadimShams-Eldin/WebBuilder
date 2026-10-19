import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { selectActivePage, useEditorStore } from '../editor/store.ts'
import { findNode } from '../editor/tree.ts'
import type { AnimationKeyframe } from '../editor/types.ts'
import {
  addKeyframe,
  collectTimelineTracks,
  createDefaultAnimation,
  moveKeyframe,
  patchTrackTiming,
  pxToSeconds,
  removeKeyframe,
  secondsToPx,
  timelineDuration,
  type TimelineTrack,
} from '../editor/timeline.ts'
import { useI18n } from '../editor/useI18n.ts'

export function Timeline() {
  const { t } = useI18n()
  const open = useEditorStore((s) => s.timelineOpen)
  const setTimelineOpen = useEditorStore((s) => s.setTimelineOpen)
  const playhead = useEditorStore((s) => s.playhead)
  const setPlayhead = useEditorStore((s) => s.setPlayhead)
  const selectedId = useEditorStore((s) => s.selectedId)
  const setSelectedId = useEditorStore((s) => s.setSelectedId)
  const updateNodeById = useEditorStore((s) => s.updateNodeById)
  const page = useEditorStore(selectActivePage)
  const [playing, setPlaying] = useState(false)
  const rulerRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef(playhead)

  useEffect(() => {
    playheadRef.current = playhead
  }, [playhead])

  const tracks = useMemo(() => (page ? collectTimelineTracks(page.root) : []), [page])
  const duration = timelineDuration(tracks)
  const width = secondsToPx(duration)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      const next = playheadRef.current + delta
      if (next >= duration) {
        useEditorStore.getState().setPlayhead(duration)
        setPlaying(false)
        return
      }
      useEditorStore.getState().setPlayhead(next)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, duration])

  if (!open) return null

  const seekFromEvent = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = rulerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = event.clientX - rect.left + el.scrollLeft
    setPlayhead(Math.min(duration, pxToSeconds(x)))
    setPlaying(false)
  }

  const addToSelected = () => {
    if (!selectedId || !page) return
    const node = findNode(page.root, selectedId)
    if (!node || node.animation) return
    updateNodeById(selectedId, { animation: createDefaultAnimation() })
  }

  return (
    <section className="flex h-44 shrink-0 flex-col border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex items-center gap-2 border-b border-neutral-200 px-3 py-1.5 text-xs dark:border-neutral-800">
        <span className="font-semibold text-neutral-700 dark:text-neutral-200">{t('tl.title')}</span>
        <button
          type="button"
          className="rounded px-2 py-0.5 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          onClick={() => setPlaying((value) => !value)}
          disabled={tracks.length === 0}
        >
          {playing ? t('tl.pause') : t('tl.play')}
        </button>
        <button
          type="button"
          className="rounded px-2 py-0.5 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          onClick={addToSelected}
          disabled={!selectedId || Boolean(page && selectedId && findNode(page.root, selectedId)?.animation)}
        >
          {t('anim.add')}
        </button>
        <span className="ms-auto font-mono text-[11px] text-neutral-400">
          {playhead.toFixed(2)}
          {t('tl.seconds')}
        </span>
        <button
          type="button"
          className="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => {
            setPlaying(false)
            setTimelineOpen(false)
          }}
        >
          {t('tl.close')}
        </button>
      </header>

      {tracks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 text-xs text-neutral-400">
          {t('tl.empty')}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ul className="w-40 shrink-0 overflow-y-auto border-e border-neutral-200 dark:border-neutral-800">
            {tracks.map((track) => (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(track.id)}
                  className={`flex h-7 w-full items-center truncate px-3 text-start text-[11px] ${
                    selectedId === track.id
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  {track.name}
                </button>
              </li>
            ))}
          </ul>
          <div
            ref={rulerRef}
            dir="ltr"
            className="relative min-w-0 flex-1 select-none overflow-auto"
            onPointerDown={seekFromEvent}
          >
            <div
              className="sticky top-0 z-10 h-5 border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
              style={{ width }}
            >
              {Array.from({ length: Math.floor(duration) + 1 }, (_, second) => (
                <span
                  key={second}
                  className="absolute top-0.5 text-[10px] text-neutral-400"
                  style={{ left: secondsToPx(second) + 4 }}
                >
                  {second}s
                </span>
              ))}
            </div>
            <div className="relative" style={{ width, minHeight: tracks.length * 28 }}>
              {tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  top={index * 28}
                  track={track}
                  selected={selectedId === track.id}
                  onSelect={() => setSelectedId(track.id)}
                  onTiming={(delay, durationValue) =>
                    updateNodeById(track.id, {
                      animation: patchTrackTiming(track.animation, {
                        delay,
                        duration: durationValue,
                      }),
                    })
                  }
                  onKeyframes={(keyframes) =>
                    updateNodeById(track.id, {
                      animation: { ...track.animation, keyframes },
                    })
                  }
                  t={t}
                />
              ))}
              <div
                className="pointer-events-none absolute inset-y-0 z-20 w-px bg-red-500"
                style={{ left: secondsToPx(playhead) }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function TrackRow({
  track,
  top,
  selected,
  onSelect,
  onTiming,
  onKeyframes,
  t,
}: {
  track: TimelineTrack
  top: number
  selected: boolean
  onSelect: () => void
  onTiming: (delay: number, duration: number) => void
  onKeyframes: (frames: AnimationKeyframe[]) => void
  t: (key: string) => string
}) {
  const left = secondsToPx(track.start)
  const width = Math.max(8, secondsToPx(track.end - track.start))

  return (
    <div className="absolute h-7" style={{ top, left: 0, right: 0 }} onClick={onSelect}>
      <div
        className={`absolute top-1 h-5 rounded-sm ${
          selected ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-700'
        }`}
        style={{ left, width }}
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect()
          const startX = event.clientX
          const origin = track.start
          const move = (moveEvent: PointerEvent) => {
            const delta = pxToSeconds(moveEvent.clientX - startX)
            onTiming(Math.max(0, origin + delta), track.animation.duration)
          }
          const up = () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', up)
        }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          const at = Math.min(1, Math.max(0, event.nativeEvent.offsetX / Math.max(width, 1)))
          onKeyframes(addKeyframe(track.keyframes, track.animation.effect, at))
        }}
      >
        {track.keyframes.map((frame) => (
          <button
            key={frame.at}
            type="button"
            title={
              frame.at === 0 || frame.at === 1
                ? `${Math.round(frame.at * 100)}%`
                : t('tl.removeKeyframe')
            }
            className="absolute top-0.5 h-4 w-1.5 -translate-x-1/2 rounded-sm bg-white shadow-sm"
            style={{ left: `${frame.at * 100}%` }}
            onPointerDown={(event) => {
              event.stopPropagation()
              const bar = (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
              let frames = track.keyframes
              let currentAt = frame.at
              const move = (moveEvent: PointerEvent) => {
                const at = Math.min(1, Math.max(0, (moveEvent.clientX - bar.left) / bar.width))
                frames = moveKeyframe(frames, track.animation.effect, currentAt, at)
                currentAt = at
                onKeyframes(frames)
              }
              const up = () => {
                window.removeEventListener('pointermove', move)
                window.removeEventListener('pointerup', up)
              }
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()
              if (frame.at === 0 || frame.at === 1) return
              onKeyframes(removeKeyframe(track.keyframes, track.animation.effect, frame.at))
            }}
          />
        ))}
      </div>
    </div>
  )
}
