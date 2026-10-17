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

  if (mod && input.altKey) {
    if (key === 'c') return 'copy-style'
    if (key === 'v') return 'paste-style'
    return null
  }

  if (mod) {
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
