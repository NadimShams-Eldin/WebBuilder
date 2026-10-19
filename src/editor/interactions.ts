import { createId } from './createNode.ts'
import type { InteractionAction, InteractionEvent, Node, NodeInteraction, Project } from './types.ts'

export const INTERACTION_EVENTS: readonly InteractionEvent[] = ['click', 'hover', 'leave', 'scroll']

export const INTERACTION_ACTIONS: readonly InteractionAction[] = ['play', 'pause', 'restart']

export const DEFAULT_INTERACTION: Omit<NodeInteraction, 'id'> = {
  event: 'click',
  action: 'play',
  targetId: '',
}

export function isInteractionEvent(value: unknown): value is InteractionEvent {
  return (INTERACTION_EVENTS as readonly string[]).includes(String(value))
}

export function isInteractionAction(value: unknown): value is InteractionAction {
  return (INTERACTION_ACTIONS as readonly string[]).includes(String(value))
}

export function normalizeInteraction(
  value: unknown,
  usedIds: Set<string>,
): NodeInteraction | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as NodeInteraction
  if (!isInteractionEvent(raw.event) || !isInteractionAction(raw.action)) return null
  const targetId = typeof raw.targetId === 'string' ? raw.targetId.trim() : ''
  if (!targetId) return null
  let id = typeof raw.id === 'string' ? raw.id.trim() : ''
  if (!id || usedIds.has(id)) id = createId('ix')
  usedIds.add(id)
  return { id, event: raw.event, action: raw.action, targetId }
}

export function normalizeInteractions(value: unknown): NodeInteraction[] {
  if (!Array.isArray(value)) return []
  const used = new Set<string>()
  return value
    .map((item) => normalizeInteraction(item, used))
    .filter((item): item is NodeInteraction => Boolean(item))
}

export function createInteraction(targetId = ''): NodeInteraction {
  return {
    id: createId('ix'),
    event: DEFAULT_INTERACTION.event,
    action: DEFAULT_INTERACTION.action,
    targetId,
  }
}

export function nodeInteractions(node: Node): NodeInteraction[] {
  return Array.isArray(node.interactions) ? node.interactions : []
}

export type CollectedInteraction = {
  sourceId: string
  interaction: NodeInteraction
}

export function collectInteractions(root: Node): CollectedInteraction[] {
  const items: CollectedInteraction[] = []
  const walk = (node: Node) => {
    for (const interaction of nodeInteractions(node)) {
      items.push({ sourceId: node.id, interaction })
    }
    for (const child of node.children) walk(child)
  }
  walk(root)
  return items
}

export function collectProjectInteractions(project: Project): CollectedInteraction[] {
  return project.pages.flatMap((page) => collectInteractions(page.root))
}

export function hasInteractions(node: Node): boolean {
  return collectInteractions(node).length > 0
}

export function hasProjectInteractions(project: Project): boolean {
  return collectProjectInteractions(project).length > 0
}

export type NamedNode = { id: string; name: string; type: Node['type'] }

export function collectNamedNodes(root: Node): NamedNode[] {
  const items: NamedNode[] = []
  const walk = (node: Node) => {
    items.push({ id: node.id, name: node.name, type: node.type })
    for (const child of node.children) walk(child)
  }
  walk(root)
  return items
}

export function pruneInteractions(root: Node): Node {
  const ids = new Set<string>()
  const collect = (node: Node) => {
    ids.add(node.id)
    for (const child of node.children) collect(child)
  }
  collect(root)
  const walk = (node: Node): Node => {
    const children = node.children.map(walk)
    const current = nodeInteractions(node)
    const interactions = current.filter((item) => ids.has(item.targetId))
    const sameChildren = children.every((child, index) => child === node.children[index])
    const sameIx =
      interactions.length === current.length &&
      interactions.every((item, index) => item === current[index])
    if (sameChildren && sameIx) return node
    return { ...node, children, interactions }
  }
  return walk(root)
}

export function cloneInteractionList(
  list: NodeInteraction[] | undefined,
  idMap?: Map<string, string>,
): NodeInteraction[] {
  return (list ?? []).map((item) => ({
    ...item,
    id: createId('ix'),
    targetId: idMap?.get(item.targetId) ?? item.targetId,
  }))
}

export function interactionAttr(node: Node): string {
  const list = nodeInteractions(node)
  if (list.length === 0) return ''
  const payload = list.map((item) => ({
    e: item.event,
    a: item.action,
    t: item.targetId,
  }))
  return JSON.stringify(payload)
}

export const INTERACTION_SCRIPT_BODY = `(function () {
  function byId(id) {
    if (!id) return null;
    try {
      return document.querySelector('[data-qid="' + CSS.escape(id) + '"]');
    } catch (err) {
      return document.querySelector('[data-qid="' + id + '"]');
    }
  }
  function applyAction(el, action) {
    if (!el) return;
    if (action === 'pause') {
      el.style.animationPlayState = 'paused';
      return;
    }
    el.classList.add('q-in');
    if (action === 'restart') {
      var prev = el.style.animation;
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = prev;
    }
    el.style.animationPlayState = 'running';
  }
  function run(source, action, targetId) {
    applyAction(byId(targetId) || source, action);
  }
  var sources = document.querySelectorAll('[data-qix]');
  if (!sources.length) return;
  var scrollIo = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var queued = entry.target.__qixScroll;
          if (!queued) return;
          queued.forEach(function (item) { run(entry.target, item.a, item.t); });
          scrollIo.unobserve(entry.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' })
    : null;
  sources.forEach(function (el) {
    var raw = el.getAttribute('data-qix');
    if (!raw) return;
    var list;
    try { list = JSON.parse(raw); } catch (err) { return; }
    if (!Array.isArray(list)) return;
    var scrollItems = [];
    list.forEach(function (item) {
      if (!item || !item.e || !item.a) return;
      if (item.e === 'click') {
        el.addEventListener('click', function (event) {
          event.preventDefault();
          run(el, item.a, item.t);
        });
      } else if (item.e === 'hover') {
        el.addEventListener('mouseenter', function () { run(el, item.a, item.t); });
        el.addEventListener('focus', function () { run(el, item.a, item.t); });
      } else if (item.e === 'leave') {
        el.addEventListener('mouseleave', function () { run(el, item.a, item.t); });
        el.addEventListener('blur', function () { run(el, item.a, item.t); });
      } else if (item.e === 'scroll') {
        scrollItems.push(item);
      }
    });
    if (scrollItems.length) {
      if (!scrollIo) {
        scrollItems.forEach(function (item) { run(el, item.a, item.t); });
        return;
      }
      el.__qixScroll = scrollItems;
      scrollIo.observe(el);
    }
  });
})();
`
