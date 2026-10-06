import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import {
  canRedo,
  canUndo,
  emptyHistory,
  HISTORY_LIMIT,
  pushHistory,
  redoHistory,
  shouldCoalesceUpdate,
  snapshotOf,
  undoHistory,
  UPDATE_COALESCE_MS,
} from './history.ts'
import { addNodeToProject, updateNodeInProject } from './tree.ts'

describe('history snapshots', () => {
  it('undoes and redoes a sequence of project mutations', () => {
    const start = createProject()
    let present = snapshotOf(start, null)
    let history = emptyHistory()

    const added = addNodeToProject(present.project, null, 'heading')
    assert.ok(added)
    history = pushHistory(history, present)
    present = snapshotOf(added.project, added.node.id)

    const patched = updateNodeInProject(present.project, added.node.id, {
      props: { text: 'عنوان جديد' },
    })
    assert.ok(patched)
    history = pushHistory(history, present)
    present = snapshotOf(patched, added.node.id)

    const undone = undoHistory(history, present)
    assert.ok(undone)
    history = undone.history
    present = undone.snapshot
    const heading = present.project.pages[0].root.children[0]
    assert.equal(heading.props.text, 'عنوان')
    assert.equal(present.selectedId, added.node.id)

    const undoneAdd = undoHistory(history, present)
    assert.ok(undoneAdd)
    history = undoneAdd.history
    present = undoneAdd.snapshot
    assert.equal(present.project.pages[0].root.children.length, 0)
    assert.equal(present.selectedId, null)

    const redoneAdd = redoHistory(history, present)
    assert.ok(redoneAdd)
    history = redoneAdd.history
    present = redoneAdd.snapshot
    assert.equal(present.project.pages[0].root.children[0].type, 'heading')

    const redonePatch = redoHistory(history, present)
    assert.ok(redonePatch)
    present = redonePatch.snapshot
    assert.equal(present.project.pages[0].root.children[0].props.text, 'عنوان جديد')
    assert.equal(canUndo(redonePatch.history), true)
    assert.equal(canRedo(redonePatch.history), false)
  })

  it('clears the redo stack after a new mutation', () => {
    const start = createProject()
    let present = snapshotOf(start, null)
    let history = emptyHistory()

    const first = addNodeToProject(present.project, null, 'heading')
    assert.ok(first)
    history = pushHistory(history, present)
    present = snapshotOf(first.project, first.node.id)

    const undone = undoHistory(history, present)
    assert.ok(undone)
    history = undone.history
    present = undone.snapshot

    const second = addNodeToProject(present.project, null, 'text')
    assert.ok(second)
    history = pushHistory(history, present)
    present = snapshotOf(second.project, second.node.id)

    assert.equal(canRedo(history), false)
    assert.equal(present.project.pages[0].root.children[0].type, 'text')
  })

  it('caps the past stack at HISTORY_LIMIT', () => {
    let present = snapshotOf(createProject(), null)
    let history = emptyHistory()
    for (let i = 0; i < HISTORY_LIMIT + 5; i += 1) {
      history = pushHistory(history, present)
      const extra = createNode('heading')
      present = snapshotOf(
        {
          ...present.project,
          name: `p${i}`,
        },
        extra.id,
      )
    }
    assert.equal(history.past.length, HISTORY_LIMIT)
    assert.equal(history.past[0].project.name, 'p4')
  })

  it('coalesces successive updates on the same node', () => {
    const id = 'h1'
    assert.equal(shouldCoalesceUpdate({ kind: 'update', id, at: 1000 }, id, 1000 + UPDATE_COALESCE_MS), true)
    assert.equal(shouldCoalesceUpdate({ kind: 'update', id, at: 1000 }, id, 1000 + UPDATE_COALESCE_MS + 1), false)
    assert.equal(shouldCoalesceUpdate({ kind: 'update', id, at: 1000 }, 'other', 1100), false)
    assert.equal(shouldCoalesceUpdate(null, id, 1100), false)
  })
})
