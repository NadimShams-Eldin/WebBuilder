import type { AnimationEffect, AnimationTrigger, Node, NodeAnimation, Project } from './types.ts'

export const ANIMATION_TRIGGERS: readonly AnimationTrigger[] = ['scroll', 'hover', 'load']

export const ANIMATION_EFFECTS: readonly AnimationEffect[] = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom',
]

export const ANIMATION_EASINGS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'] as const

export type AnimationEasing = (typeof ANIMATION_EASINGS)[number]

export const ANIMATION_TRIGGER_LABELS: Record<AnimationTrigger, string> = {
  scroll: 'عند التمرير',
  hover: 'عند المرور',
  load: 'عند التحميل',
}

export const ANIMATION_EFFECT_LABELS: Record<AnimationEffect, string> = {
  fade: 'تلاشي',
  'slide-up': 'انزلاق لأعلى',
  'slide-down': 'انزلاق لأسفل',
  'slide-left': 'انزلاق لليسار',
  'slide-right': 'انزلاق لليمين',
  zoom: 'تكبير',
}

export const ANIMATION_EASING_LABELS: Record<AnimationEasing, string> = {
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  linear: 'linear',
}

export const DEFAULT_ANIMATION: NodeAnimation = {
  trigger: 'scroll',
  effect: 'fade',
  delay: 0,
  duration: 0.6,
  easing: 'ease',
}

const FROM: Record<AnimationEffect, string> = {
  fade: 'opacity: 0',
  'slide-up': 'opacity: 0; transform: translateY(1.5rem)',
  'slide-down': 'opacity: 0; transform: translateY(-1.5rem)',
  'slide-left': 'opacity: 0; transform: translateX(1.5rem)',
  'slide-right': 'opacity: 0; transform: translateX(-1.5rem)',
  zoom: 'opacity: 0; transform: scale(0.92)',
}

const TO = 'opacity: 1; transform: none'

function clampTime(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(5, Math.max(0, Math.round(value * 100) / 100))
}

export function isAnimationTrigger(value: unknown): value is AnimationTrigger {
  return (ANIMATION_TRIGGERS as readonly string[]).includes(String(value))
}

export function isAnimationEffect(value: unknown): value is AnimationEffect {
  return (ANIMATION_EFFECTS as readonly string[]).includes(String(value))
}

export function isAnimationEasing(value: unknown): value is AnimationEasing {
  return (ANIMATION_EASINGS as readonly string[]).includes(String(value))
}

export function normalizeAnimation(value: NodeAnimation | null | undefined): NodeAnimation | null {
  if (!value) return null
  return {
    trigger: isAnimationTrigger(value.trigger) ? value.trigger : DEFAULT_ANIMATION.trigger,
    effect: isAnimationEffect(value.effect) ? value.effect : DEFAULT_ANIMATION.effect,
    delay: clampTime(value.delay, DEFAULT_ANIMATION.delay),
    duration: clampTime(value.duration, DEFAULT_ANIMATION.duration),
    easing: isAnimationEasing(value.easing) ? value.easing : DEFAULT_ANIMATION.easing,
  }
}

export type AnimatedNode = {
  id: string
  animation: NodeAnimation
}

export function collectAnimated(node: Node): AnimatedNode[] {
  const items: AnimatedNode[] = []
  const walk = (current: Node) => {
    const animation = normalizeAnimation(current.animation)
    if (animation) items.push({ id: current.id, animation })
    for (const child of current.children) walk(child)
  }
  walk(node)
  return items
}

export function collectProjectAnimated(project: Project): AnimatedNode[] {
  return project.pages.flatMap((page) => collectAnimated(page.root))
}

export function hasScrollAnimation(node: Node): boolean {
  return collectAnimated(node).some((item) => item.animation.trigger === 'scroll')
}

function classNameFor(id: string): string {
  return `q-${id}`
}

export function renderAnimationCss(project: Project): string {
  const items = collectProjectAnimated(project)
  if (items.length === 0) return ''

  const used = new Set(items.map((item) => item.animation.effect))
  const lines: string[] = []

  for (const effect of ANIMATION_EFFECTS) {
    if (!used.has(effect)) continue
    lines.push(`@keyframes q-anim-${effect} { from { ${FROM[effect]}; } to { ${TO}; } }`)
  }

  for (const { id, animation } of items) {
    const cls = `.${classNameFor(id)}`
    const timing = `${animation.duration}s ${animation.easing} ${animation.delay}s`
    if (animation.trigger === 'load') {
      lines.push(`${cls} { animation: q-anim-${animation.effect} ${timing} both; }`)
      continue
    }
    lines.push(
      `${cls} { ${FROM[animation.effect]}; transition: opacity ${timing}, transform ${timing}; }`,
    )
    const target =
      animation.trigger === 'hover' ? `${cls}:hover, ${cls}:focus-visible` : `${cls}.q-in`
    lines.push(`${target} { ${TO}; }`)
  }

  lines.push(
    '@media (prefers-reduced-motion: reduce) { [data-qanim] { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; } }',
  )
  return lines.join('\n')
}

export const ANIMATION_SCRIPT_BODY = `(function () {
  var nodes = document.querySelectorAll('[data-qanim="scroll"]');
  if (!nodes.length) return;
  function show(el) { el.classList.add('q-in'); }
  if (!('IntersectionObserver' in window)) {
    nodes.forEach(show);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  nodes.forEach(function (el) { io.observe(el); });
})();
`

export const ANIMATION_SCRIPT = `<script>
${ANIMATION_SCRIPT_BODY}</script>`
