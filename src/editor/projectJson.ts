import { normalizeAnimation } from './animation.ts'
import { createId } from './createNode.ts'
import { DEFAULT_THEME } from './createProject.ts'
import { isAllowedCssProp } from './cssWhitelist.ts'
import { uniqueSlug } from './pages.ts'
import {
  NODE_TYPES,
  type Asset,
  type ButtonType,
  type FormMethod,
  type InputType,
  type LinkTarget,
  type Node,
  type NodeProps,
  type NodeStyle,
  type NodeType,
  type Page,
  type Project,
  type Theme,
} from './types.ts'

export const PROJECT_JSON_VERSION = 1

export type ProjectParseError =
  | 'invalid-json'
  | 'invalid-project'
  | 'missing-pages'

export type ProjectParseResult =
  | { ok: true; project: Project }
  | { ok: false; error: ProjectParseError }

const NODE_TYPE_SET = new Set<string>(NODE_TYPES)
const INPUT_TYPES: readonly InputType[] = [
  'text',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'email',
  'password',
]
const BUTTON_TYPES: readonly ButtonType[] = ['button', 'submit', 'reset']
const FORM_METHODS: readonly FormMethod[] = ['get', 'post']
const LINK_TARGETS: readonly LinkTarget[] = ['_self', '_blank']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => String(item))
}

function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && NODE_TYPE_SET.has(value)
}

function sanitizeTheme(value: unknown): Theme {
  if (!isRecord(value)) return { ...DEFAULT_THEME }
  const direction = value.direction === 'ltr' ? 'ltr' : 'rtl'
  return {
    fontFamily: asString(value.fontFamily, DEFAULT_THEME.fontFamily),
    backgroundColor: asString(value.backgroundColor, DEFAULT_THEME.backgroundColor),
    textColor: asString(value.textColor, DEFAULT_THEME.textColor),
    direction,
  }
}

function sanitizeStyle(value: unknown): NodeStyle {
  if (!isRecord(value)) return {}
  const style: NodeStyle = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!isAllowedCssProp(key)) continue
    if (typeof raw === 'string' || typeof raw === 'number') style[key] = raw
  }
  return style
}

function sanitizeProps(value: unknown): NodeProps {
  if (!isRecord(value)) return {}
  const props: NodeProps = {}
  const text = asString(value.text)
  if (text) props.text = text
  const level = asNumber(value.level)
  if (level && level >= 1 && level <= 6) props.level = level as NodeProps['level']
  if (typeof value.href === 'string') props.href = value.href
  if (LINK_TARGETS.includes(value.target as LinkTarget)) props.target = value.target as LinkTarget
  if (typeof value.src === 'string') props.src = value.src
  if (typeof value.alt === 'string') props.alt = value.alt
  const items = asStringArray(value.items)
  if (items) props.items = items
  const ordered = asBoolean(value.ordered)
  if (ordered !== undefined) props.ordered = ordered
  if (typeof value.name === 'string') props.name = value.name
  if (typeof value.placeholder === 'string') props.placeholder = value.placeholder
  if (INPUT_TYPES.includes(value.inputType as InputType)) props.inputType = value.inputType as InputType
  const options = asStringArray(value.options)
  if (options) props.options = options
  const checked = asBoolean(value.checked)
  if (checked !== undefined) props.checked = checked
  if (typeof value.value === 'string') props.value = value.value
  if (BUTTON_TYPES.includes(value.type as ButtonType)) props.type = value.type as ButtonType
  if (typeof value.action === 'string') props.action = value.action
  if (FORM_METHODS.includes(value.method as FormMethod)) props.method = value.method as FormMethod
  if (typeof value.poster === 'string') props.poster = value.poster
  const controls = asBoolean(value.controls)
  if (controls !== undefined) props.controls = controls
  const autoplay = asBoolean(value.autoplay)
  if (autoplay !== undefined) props.autoplay = autoplay
  const loop = asBoolean(value.loop)
  if (loop !== undefined) props.loop = loop
  if (typeof value.label === 'string') props.label = value.label
  return props
}

function sanitizeNode(value: unknown, usedIds: Set<string>): Node | null {
  if (!isRecord(value) || !isNodeType(value.type)) return null
  let id = asString(value.id)
  if (!id || usedIds.has(id)) id = createId()
  usedIds.add(id)
  const children = Array.isArray(value.children)
    ? value.children
        .map((child) => sanitizeNode(child, usedIds))
        .filter((child): child is Node => Boolean(child))
    : []
  return {
    id,
    type: value.type,
    name: asString(value.name, value.type),
    props: sanitizeProps(value.props),
    style: sanitizeStyle(value.style),
    animation: normalizeAnimation(value.animation as Node['animation']),
    children,
  }
}

function sanitizeAsset(value: unknown, usedIds: Set<string>): Asset | null {
  if (!isRecord(value)) return null
  const src = asString(value.src)
  const name = asString(value.name)
  const mimeType = asString(value.mimeType)
  if (!src || !name) return null
  let id = asString(value.id)
  if (!id || usedIds.has(id)) id = createId('a')
  usedIds.add(id)
  return { id, name, mimeType: mimeType || 'application/octet-stream', src }
}

function sanitizePage(value: unknown, usedIds: Set<string>, slugs: Page[]): Page | null {
  if (!isRecord(value)) return null
  const root = sanitizeNode(value.root, usedIds)
  if (!root) return null
  let id = asString(value.id)
  if (!id || usedIds.has(id)) id = createId('p')
  usedIds.add(id)
  const name = asString(value.name, 'page')
  const slug = uniqueSlug(slugs, asString(value.slug, name) || name, id)
  return { id, name, slug, root }
}

export function sanitizeProject(value: unknown): Project | null {
  if (!isRecord(value)) return null
  const usedIds = new Set<string>()
  let id = asString(value.id)
  if (!id) id = createId('prj')
  usedIds.add(id)
  const pagesRaw = Array.isArray(value.pages) ? value.pages : []
  const pages: Page[] = []
  for (const item of pagesRaw) {
    const page = sanitizePage(item, usedIds, pages)
    if (page) pages.push(page)
  }
  if (pages.length === 0) return null
  const assetsRaw = Array.isArray(value.assets) ? value.assets : []
  const assets: Asset[] = []
  for (const item of assetsRaw) {
    const asset = sanitizeAsset(item, usedIds)
    if (asset) assets.push(asset)
  }
  return {
    id,
    name: asString(value.name, 'Qitma'),
    theme: sanitizeTheme(value.theme),
    pages,
    assets,
  }
}

export function parseProjectJson(raw: string): ProjectParseResult {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid-json' }
  }
  if (!isRecord(value)) return { ok: false, error: 'invalid-project' }
  const project = sanitizeProject(value)
  if (!project) return { ok: false, error: 'missing-pages' }
  return { ok: true, project }
}

export function serializeProject(project: Project): string {
  return `${JSON.stringify(project, null, 2)}\n`
}

export function projectFileName(project: Project): string {
  const slug = project.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'qitma'}.json`
}
