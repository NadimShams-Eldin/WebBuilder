import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_ANIMATION, renderAnimationCss } from './animation.ts'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import {
  addKeyframe,
  collectTimelineTracks,
  createDefaultAnimation,
  interpolateKeyframes,
  moveKeyframe,
  patchTrackTiming,
  pxToSeconds,
  removeKeyframe,
  scrubStyle,
  secondsToPx,
  timelineDuration,
} from './timeline.ts'

describe('timeline tracks', () => {
  it('collects animated nodes with start and end times', () => {
    const heading = createNode('heading', 'h')
    heading.name = 'عنوان'
    heading.animation = { ...DEFAULT_ANIMATION, delay: 0.4, duration: 0.8 }
    const root = createNode('container', 'root')
    root.children = [heading, createNode('text', 't')]
    const tracks = collectTimelineTracks(root)
    assert.equal(tracks.length, 1)
    assert.equal(tracks[0].id, 'h')
    assert.equal(tracks[0].start, 0.4)
    assert.equal(tracks[0].end, 1.2)
    assert.equal(tracks[0].keyframes.length, 2)
    assert.ok(timelineDuration(tracks) >= 2)
  })
})

describe('keyframes', () => {
  it('interpolates between frames and supports add/move/remove', () => {
    const base = [
      { at: 0, opacity: 0, x: 0, y: 20, scale: 1 },
      { at: 1, opacity: 1, x: 0, y: 0, scale: 1 },
    ]
    const mid = interpolateKeyframes(base, 0.5)
    assert.equal(mid.opacity, 0.5)
    assert.equal(mid.y, 10)

    const withMid = addKeyframe(base, 'slide-up', 0.5)
    assert.equal(withMid.length, 3)
    assert.ok(withMid.some((frame) => frame.at === 0.5))

    const moved = moveKeyframe(withMid, 'slide-up', 0.5, 0.7)
    assert.ok(moved.some((frame) => frame.at === 0.7))
    assert.equal(moved.some((frame) => frame.at === 0.5), false)

    const removed = removeKeyframe(moved, 'slide-up', 0.7)
    assert.equal(removed.length, 2)
    assert.ok(removed.every((frame) => frame.at === 0 || frame.at === 1))
  })

  it('scrubs a pose before, during, and after the clip', () => {
    const animation = {
      ...DEFAULT_ANIMATION,
      delay: 1,
      duration: 1,
      effect: 'fade' as const,
      keyframes: [
        { at: 0, opacity: 0, x: 0, y: 0, scale: 1 },
        { at: 1, opacity: 1, x: 0, y: 0, scale: 1 },
      ],
    }
    assert.equal(scrubStyle(animation, 0).opacity, 0)
    assert.equal(scrubStyle(animation, 1.5).opacity, 0.5)
    assert.equal(scrubStyle(animation, 3).opacity, 1)
  })

  it('patches delay and duration with a floor', () => {
    const next = patchTrackTiming(createDefaultAnimation(), { delay: -1, duration: 0 })
    assert.equal(next.delay, 0)
    assert.equal(next.duration, 0.1)
  })

  it('converts seconds and pixels both ways', () => {
    assert.equal(secondsToPx(1), 120)
    assert.equal(pxToSeconds(240), 2)
  })
})

describe('custom keyframe css', () => {
  it('emits a per-node keyframe block when frames are present', () => {
    const heading = createNode('heading', 'h')
    heading.animation = {
      trigger: 'load',
      effect: 'fade',
      delay: 0,
      duration: 0.6,
      easing: 'ease',
      keyframes: [
        { at: 0, opacity: 0, y: 16 },
        { at: 1, opacity: 1, y: 0 },
      ],
    }
    const root = createNode('container', 'root')
    root.children = [heading]
    const project = createProject()
    project.pages[0].root = root
    const css = renderAnimationCss(project)
    assert.ok(css.includes('@keyframes q-anim-h'))
    assert.ok(css.includes('0% {'))
    assert.ok(css.includes('100% {'))
    assert.ok(css.includes('.q-h { animation: q-anim-h 0.6s ease 0s both; }'))
  })
})
