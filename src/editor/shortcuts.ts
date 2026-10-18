export type ShortcutAction =
  | 'undo'
  | 'redo'
  | 'duplicate'
  | 'delete'
  | 'copy-style'
  | 'paste-style'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'exit-preview'
  | 'toggle-preview'
  | 'command-palette'
  | 'shortcuts'

export type ShortcutGroup = {
  id: string
  labelKey: string
  items: Array<{ action: ShortcutAction; keys: string }>
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: 'general',
    labelKey: 'shortcut.group.general',
    items: [
      { action: 'command-palette', keys: 'Ctrl+K' },
      { action: 'shortcuts', keys: '?' },
      { action: 'toggle-preview', keys: 'Ctrl+Enter' },
      { action: 'exit-preview', keys: 'Esc' },
    ],
  },
  {
    id: 'edit',
    labelKey: 'shortcut.group.edit',
    items: [
      { action: 'undo', keys: 'Ctrl+Z' },
      { action: 'redo', keys: 'Ctrl+Shift+Z' },
      { action: 'duplicate', keys: 'Ctrl+D' },
      { action: 'delete', keys: 'Del' },
    ],
  },
  {
    id: 'style',
    labelKey: 'shortcut.group.style',
    items: [
      { action: 'copy-style', keys: 'Ctrl+Alt+C' },
      { action: 'paste-style', keys: 'Ctrl+Alt+V' },
    ],
  },
  {
    id: 'view',
    labelKey: 'shortcut.group.view',
    items: [
      { action: 'zoom-in', keys: 'Ctrl++' },
      { action: 'zoom-out', keys: 'Ctrl+-' },
      { action: 'zoom-reset', keys: 'Ctrl+0' },
    ],
  },
]

export type ShortcutInput = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export function resolveShortcut(input: ShortcutInput): ShortcutAction | null {
  const mod = input.ctrlKey || input.metaKey
  const key = input.key.toLowerCase()

  if (key === 'escape') return 'exit-preview'
  if (key === '?') return 'shortcuts'

  if (mod && input.altKey) {
    if (key === 'c') return 'copy-style'
    if (key === 'v') return 'paste-style'
    return null
  }

  if (mod) {
    if (key === 'k') return 'command-palette'
    if (key === 'enter') return 'toggle-preview'
    if (key === 'z') return input.shiftKey ? 'redo' : 'undo'
    if (key === 'y') return 'redo'
    if (key === 'd') return 'duplicate'
    if (key === '=' || key === '+') return 'zoom-in'
    if (key === '-') return 'zoom-out'
    if (key === '0') return 'zoom-reset'
    return null
  }

  if (key === 'delete' || key === 'backspace') return 'delete'
  return null
}
