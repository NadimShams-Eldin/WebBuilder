export type ContextAction =
  | 'duplicate'
  | 'delete'
  | 'wrap-container'
  | 'wrap-flex'
  | 'wrap-grid'
  | 'copy-style'
  | 'paste-style'
  | 'select-parent'
  | 'select-child'
  | 'open-properties'

export type MenuEntry =
  | {
      kind: 'item'
      action: ContextAction
      labelKey: string
      shortcut?: string
      disabled?: boolean
      danger?: boolean
    }
  | { kind: 'separator'; id: string }

export type ContextMenuOptions = {
  isRoot: boolean
  hasChildren: boolean
  hasStyleClipboard: boolean
}

export function buildContextMenu(options: ContextMenuOptions): MenuEntry[] {
  const root = options.isRoot
  return [
    {
      kind: 'item',
      action: 'duplicate',
      labelKey: 'action.duplicate',
      shortcut: 'Ctrl+D',
      disabled: root,
    },
    {
      kind: 'item',
      action: 'wrap-container',
      labelKey: 'action.wrapContainer',
      disabled: root,
    },
    { kind: 'item', action: 'wrap-flex', labelKey: 'action.wrapFlex', disabled: root },
    { kind: 'item', action: 'wrap-grid', labelKey: 'action.wrapGrid', disabled: root },
    { kind: 'separator', id: 'wrap-end' },
    {
      kind: 'item',
      action: 'copy-style',
      labelKey: 'action.copyStyle',
      shortcut: 'Ctrl+Alt+C',
    },
    {
      kind: 'item',
      action: 'paste-style',
      labelKey: 'action.pasteStyle',
      shortcut: 'Ctrl+Alt+V',
      disabled: !options.hasStyleClipboard,
    },
    { kind: 'separator', id: 'style-end' },
    {
      kind: 'item',
      action: 'select-parent',
      labelKey: 'action.selectParent',
      disabled: root,
    },
    {
      kind: 'item',
      action: 'select-child',
      labelKey: 'action.selectChild',
      disabled: !options.hasChildren,
    },
    {
      kind: 'item',
      action: 'open-properties',
      labelKey: 'action.openProperties',
    },
    { kind: 'separator', id: 'delete-start' },
    {
      kind: 'item',
      action: 'delete',
      labelKey: 'action.delete',
      shortcut: 'Del',
      disabled: root,
      danger: true,
    },
  ]
}

function isEnabled(entry: MenuEntry): boolean {
  return entry.kind === 'item' && !entry.disabled
}

export function firstEnabledIndex(entries: MenuEntry[]): number {
  return entries.findIndex(isEnabled)
}

export function lastEnabledIndex(entries: MenuEntry[]): number {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (isEnabled(entries[index])) return index
  }
  return -1
}

export function nextMenuIndex(
  entries: MenuEntry[],
  from: number,
  delta: number,
  loop = true,
): number {
  if (entries.length === 0) return -1
  let index = from
  for (let step = 0; step < entries.length; step += 1) {
    index += delta
    if (index < 0) {
      if (!loop) return from
      index = entries.length - 1
    }
    if (index >= entries.length) {
      if (!loop) return from
      index = 0
    }
    if (isEnabled(entries[index])) return index
  }
  return from
}

export function clampMenuPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = 8,
): { x: number; y: number } {
  const maxX = Math.max(margin, viewportWidth - width - margin)
  const maxY = Math.max(margin, viewportHeight - height - margin)
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY),
  }
}
