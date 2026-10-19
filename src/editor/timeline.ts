import { DEFAULT_ANIMATION, normalizeAnimation } from './animation.ts'
import type {
  AnimationEffect,
  AnimationKeyframe,
  Node,
  NodeAnimation,
  Page,
} from './types.ts'

export const TIMELINE_MAX = 5
export const TIMELINE_MIN_DURATION = 0.1
export const PX_PER_SECOND = 120

export type TimelineTrack = {
  id: string
  name: string
  type: Node['type']
  animation: NodeAnimation
  start: number
  end: number
  keyframes: AnimationKeyframe[]
}

const EFFECT_FROM: Record<
  AnimationEffect,
  Required<Pick<AnimationKeyframe, 'opacity' | 'x' | 'y' | 'scale'>>
> = {
  fade: { opacity: 0, x: 0, y: 0, scale: 1 },
  'slide-up': { opacity: 0, x: 0, y: 24, scale: 1 },
  'slide-down': { opacity: 0, x: 0, y: -24, scale: 1 },
  'slide-left': { opacity: 0, x: 24, y: 0, scale: 1 },
  'slide-right': { opacity: 0, x: -24, y: 0, scale: 1 },
  zoom: { opacity: 0, x: 0, y: 0, scale: 0.92 },
}

const EFFECT_TO: Required<Pick<AnimationKeyframe, 'opacity' | 'x' | 'y' | 'scale'>> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
}

export function clampTime(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(TIMELINE_MAX, Math.max(0, Math.round(value * 100) / 100))
}

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, Math.round(value * 1000) / 1000))
}

export function defaultKeyframes(effect: AnimationEffect): AnimationKeyframe[] {
  const from = EFFECT_FROM[effect] ?? EFFECT_FROM.fade
  return [
    { at: 0, ...from },
    { at: 1, ...EFFECT_TO },
  ]
}

export function normalizeKeyframes(
  keyframes: AnimationKeyframe[] | undefined,
  effect: AnimationEffect,
): AnimationKeyframe[] {
  const source = keyframes && keyframes.length >= 2 ? keyframes : defaultKeyframes(effect)
  const cleaned = source
    .map((frame) => ({
      at: clampUnit(frame.at),
      opacity:
        typeof frame.opacity === 'number' && Number.isFinite(frame.opacity)
          ? Math.min(1, Math.max(0, frame.opacity))
          : undefined,
      x: typeof frame.x === 'number' && Number.isFinite(frame.x) ? frame.x : undefined,
      y: typeof frame.y === 'number' && Number.isFinite(frame.y) ? frame.y : undefined,
      scale:
        typeof frame.scale === 'number' && Number.isFinite(frame.scale)
          ? Math.min(2, Math.max(0.1, frame.scale))
          : undefined,
    }))
    .sort((a, b) => a.at - b.at)

  if (!cleaned.some((frame) => frame.at === 0)) cleaned.unshift({ at: 0, ...EFFECT_FROM[effect] })
  if (!cleaned.some((frame) => frame.at === 1)) cleaned.push({ at: 1, ...EFFECT_TO })
  return cleaned
}

export function keyframeCss(frame: AnimationKeyframe): string {
  const parts: string[] = []
  if (frame.opacity !== undefined) parts.push(`opacity: ${frame.opacity}`)
  const transforms: string[] = []
  if (frame.x) transforms.push(`translateX(${frame.x}px)`)
  if (frame.y) transforms.push(`translateY(${frame.y}px)`)
  if (frame.scale !== undefined && frame.scale !== 1) transforms.push(`scale(${frame.scale})`)
  if (transforms.length > 0) parts.push(`transform: ${transforms.join(' ')}`)
  else if (frame.opacity !== undefined) parts.push('transform: none')
  return parts.join('; ')
}

export function interpolateKeyframes(
  keyframes: AnimationKeyframe[],
  at: number,
): Required<Pick<AnimationKeyframe, 'opacity' | 'x' | 'y' | 'scale'>> {
  const t = clampUnit(at)
  const frames = normalizeKeyframes(keyframes, 'fade')
  let previous = frames[0]
  let next = frames[frames.length - 1]
  for (let index = 0; index < frames.length - 1; index += 1) {
    if (t >= frames[index].at && t <= frames[index + 1].at) {
      previous = frames[index]
      next = frames[index + 1]
      break
    }
  }
  const span = Math.max(0.0001, next.at - previous.at)
  const mix = (t - previous.at) / span
  const mixNum = (a: number | undefined, b: number | undefined, fallback: number) =>
    (a ?? fallback) + ((b ?? fallback) - (a ?? fallback)) * mix
  return {
    opacity: mixNum(previous.opacity, next.opacity, 1),
    x: mixNum(previous.x, next.x, 0),
    y: mixNum(previous.y, next.y, 0),
    scale: mixNum(previous.scale, next.scale, 1),
  }
}

export function scrubStyle(
  animation: NodeAnimation,
  playhead: number,
): { opacity: number; transform: string } {
  const frames = normalizeKeyframes(animation.keyframes, animation.effect)
  const local = playhead - animation.delay
  if (local <= 0) return styleFromPose(interpolateKeyframes(frames, 0))
  if (local >= animation.duration) return styleFromPose(interpolateKeyframes(frames, 1))
  return styleFromPose(
    interpolateKeyframes(frames, local / Math.max(animation.duration, 0.01)),
  )
}

function styleFromPose(pose: Required<Pick<AnimationKeyframe, 'opacity' | 'x' | 'y' | 'scale'>>) {
  const transforms: string[] = []
  if (pose.x) transforms.push(`translateX(${pose.x}px)`)
  if (pose.y) transforms.push(`translateY(${pose.y}px)`)
  if (pose.scale !== 1) transforms.push(`scale(${pose.scale})`)
  return {
    opacity: pose.opacity,
    transform: transforms.length > 0 ? transforms.join(' ') : 'none',
  }
}

export function collectTimelineTracks(root: Node): TimelineTrack[] {
  const tracks: TimelineTrack[] = []
  const walk = (node: Node) => {
    const animation = normalizeAnimation(node.animation)
    if (animation) {
      const keyframes = normalizeKeyframes(animation.keyframes, animation.effect)
      tracks.push({
        id: node.id,
        name: node.name,
        type: node.type,
        animation: { ...animation, keyframes },
        start: animation.delay,
        end: clampTime(animation.delay + animation.duration),
        keyframes,
      })
    }
    for (const child of node.children) walk(child)
  }
  walk(root)
  return tracks
}

export function timelineDuration(tracks: TimelineTrack[]): number {
  if (tracks.length === 0) return 2
  return Math.max(2, ...tracks.map((track) => track.end), TIMELINE_MAX)
}

export function secondsToPx(seconds: number): number {
  return Math.round(seconds * PX_PER_SECOND)
}

export function pxToSeconds(px: number): number {
  return clampTime(px / PX_PER_SECOND)
}

export function addKeyframe(
  keyframes: AnimationKeyframe[],
  effect: AnimationEffect,
  at: number,
): AnimationKeyframe[] {
  const next = normalizeKeyframes(keyframes, effect)
  const unit = clampUnit(at)
  if (next.some((frame) => Math.abs(frame.at - unit) < 0.02)) return next
  const pose = interpolateKeyframes(next, unit)
  return normalizeKeyframes([...next, { at: unit, ...pose }], effect)
}

export function moveKeyframe(
  keyframes: AnimationKeyframe[],
  effect: AnimationEffect,
  fromAt: number,
  toAt: number,
): AnimationKeyframe[] {
  const next = normalizeKeyframes(keyframes, effect).map((frame) =>
    Math.abs(frame.at - fromAt) < 0.001 ? { ...frame, at: clampUnit(toAt) } : frame,
  )
  return normalizeKeyframes(next, effect)
}

export function removeKeyframe(
  keyframes: AnimationKeyframe[],
  effect: AnimationEffect,
  at: number,
): AnimationKeyframe[] {
  const next = normalizeKeyframes(keyframes, effect).filter((frame) => Math.abs(frame.at - at) >= 0.001)
  return normalizeKeyframes(next, effect)
}

export function patchTrackTiming(
  animation: NodeAnimation,
  patch: { delay?: number; duration?: number },
): NodeAnimation {
  return {
    ...animation,
    delay: clampTime(patch.delay ?? animation.delay, animation.delay),
    duration: Math.max(
      TIMELINE_MIN_DURATION,
      clampTime(patch.duration ?? animation.duration, animation.duration),
    ),
  }
}

export function createDefaultAnimation(): NodeAnimation {
  return {
    ...DEFAULT_ANIMATION,
    keyframes: defaultKeyframes(DEFAULT_ANIMATION.effect),
  }
}

export function pageHasAnimation(page: Page | undefined): boolean {
  if (!page) return false
  return collectTimelineTracks(page.root).length > 0
}
