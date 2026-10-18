import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  commandScore,
  filterCommands,
  nextCommandIndex,
  normalizeTokens,
  type CommandItem,
} from './commands.ts'

const commands: CommandItem[] = [
  { id: 'insert:heading', label: 'عنوان', group: 'إدراج', keywords: ['heading', 'h2'] },
  { id: 'insert:text', label: 'نص', group: 'إدراج', keywords: ['text', 'paragraph'] },
  { id: 'insert:grid', label: 'شبكة', group: 'إدراج', keywords: ['grid', 'columns'] },
  { id: 'view:preview', label: 'معاينة حية', group: 'عرض', keywords: ['preview'] },
]

describe('normalizeTokens', () => {
  it('lowercases and splits on whitespace', () => {
    assert.deepEqual(normalizeTokens('  Grid   Columns '), ['grid', 'columns'])
    assert.deepEqual(normalizeTokens(''), [])
  })
})

describe('commandScore', () => {
  it('rewards label prefix matches over keyword matches', () => {
    const prefix = commandScore(commands[2], ['شبك'])
    const keyword = commandScore(commands[2], ['columns'])
    assert.ok(prefix > keyword)
    assert.equal(commandScore(commands[2], ['missing']), 0)
  })

  it('requires every token to match', () => {
    assert.ok(commandScore(commands[2], ['شبكة', 'grid']) > 0)
    assert.equal(commandScore(commands[2], ['شبكة', 'text']), 0)
  })
})

describe('filterCommands', () => {
  it('matches latin keywords', () => {
    const result = filterCommands(commands, 'grid')
    assert.deepEqual(
      result.map((item) => item.id),
      ['insert:grid'],
    )
  })

  it('matches arabic labels', () => {
    const result = filterCommands(commands, 'معاينة')
    assert.deepEqual(
      result.map((item) => item.id),
      ['view:preview'],
    )
  })

  it('returns everything for an empty query and respects the limit', () => {
    assert.equal(filterCommands(commands, '').length, commands.length)
    assert.equal(filterCommands(commands, '', 2).length, 2)
  })

  it('returns nothing for a miss', () => {
    assert.deepEqual(filterCommands(commands, 'zzz'), [])
  })
})

describe('nextCommandIndex', () => {
  const withDisabled: CommandItem[] = [
    { ...commands[0], disabled: true },
    commands[1],
    commands[2],
  ]

  it('skips disabled commands and wraps', () => {
    assert.equal(nextCommandIndex(withDisabled, 0, 1), 1)
    assert.equal(nextCommandIndex(withDisabled, 2, 1), 1)
    assert.equal(nextCommandIndex(withDisabled, 1, -1), 2)
  })

  it('returns -1 for an empty list', () => {
    assert.equal(nextCommandIndex([], 0, 1), -1)
  })
})
