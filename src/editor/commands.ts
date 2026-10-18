export type CommandItem = {
  id: string
  label: string
  group: string
  keywords?: string[]
  shortcut?: string
  disabled?: boolean
}

export function normalizeTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

export function commandScore(command: CommandItem, tokens: string[]): number {
  if (tokens.length === 0) return 1
  const label = command.label.toLowerCase()
  const haystack = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase()

  let score = 0
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0
    const at = label.indexOf(token)
    if (at === 0) score += 100
    else if (at > 0) score += 60 - Math.min(at, 40)
    else score += 20
  }
  return score
}

export function filterCommands<T extends CommandItem>(
  commands: T[],
  query: string,
  limit = 40,
): T[] {
  const tokens = normalizeTokens(query)
  return commands
    .map((command, index) => ({ command, index, score: commandScore(command, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.command)
}

export function nextCommandIndex(
  commands: CommandItem[],
  from: number,
  delta: number,
): number {
  if (commands.length === 0) return -1
  let index = from
  for (let step = 0; step < commands.length; step += 1) {
    index = (index + delta + commands.length) % commands.length
    if (!commands[index].disabled) return index
  }
  return from
}
