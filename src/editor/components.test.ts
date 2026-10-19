import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  countInstances,
  createComponentFromNode,
  deleteComponent,
  detachInstance,
  insertComponentInstance,
  renameComponent,
  uniqueComponentName,
  updateComponentInstances,
} from './components.ts'
import { createNode } from './createNode.ts'
import { createProject } from './createProject.ts'
import { findNode } from './tree.ts'
import type { Node } from './types.ts'

function projectWith(child: Node) {
  const project = createProject()
  project.pages[0].root.children = [child]
  return project
}

describe('component library', () => {
  it('turns a subtree into a named component and replaces the source with an instance', () => {
    const card = createNode('flex', 'card')
    card.name = 'بطاقة'
    card.children = [createNode('heading', 'h'), createNode('text', 't')]
    const project = projectWith(card)

    const result = createComponentFromNode(project, 'card', project.pages[0].id, 'بطاقة')
    assert.ok(result)
    assert.equal(result!.component.name, 'بطاقة')
    assert.equal(result!.project.components.length, 1)
    const instance = result!.project.pages[0].root.children[0]
    assert.equal(instance.componentId, result!.component.id)
    assert.equal(instance.originId, result!.component.id)
    assert.notEqual(instance.id, 'card')
    assert.equal(instance.children.length, 2)
    assert.equal(countInstances(result!.project, result!.component.id), 1)
  })

  it('refuses the page root and already-instanced nodes', () => {
    const project = createProject()
    assert.equal(createComponentFromNode(project, project.pages[0].root.id), null)
    const heading = createNode('heading', 'h')
    project.pages[0].root.children = [heading]
    const first = createComponentFromNode(project, 'h')
    assert.ok(first)
    const instanceId = first!.project.pages[0].root.children[0].id
    assert.equal(createComponentFromNode(first!.project, instanceId), null)
  })

  it('inserts a fresh instance that stays linked to the definition', () => {
    const heading = createNode('heading', 'h')
    heading.props = { ...heading.props, text: 'عنوان البطاقة' }
    const created = createComponentFromNode(projectWith(heading), 'h')
    assert.ok(created)
    const next = insertComponentInstance(
      created!.project,
      created!.component.id,
      created!.project.pages[0].root.id,
    )
    assert.ok(next)
    assert.equal(countInstances(next!.project, created!.component.id), 2)
    assert.notEqual(next!.node.id, created!.project.pages[0].root.children[0].id)
    assert.equal(next!.node.props.text, 'عنوان البطاقة')
  })

  it('propagates edits from one instance to every copy and the definition', () => {
    const heading = createNode('heading', 'h')
    heading.props = { ...heading.props, text: 'قديم' }
    const created = createComponentFromNode(projectWith(heading), 'h')
    assert.ok(created)
    const withCopy = insertComponentInstance(
      created!.project,
      created!.component.id,
      created!.project.pages[0].root.id,
    )
    assert.ok(withCopy)
    const firstId = withCopy!.project.pages[0].root.children[0].id
    const updated = updateComponentInstances(withCopy!.project, firstId, {
      props: { text: 'جديد' },
      style: { color: '#111111' },
    })
    assert.ok(updated)
    const texts = updated!.pages[0].root.children.map((node) => node.props.text)
    assert.deepEqual(texts, ['جديد', 'جديد'])
    assert.equal(updated!.components[0].root.props.text, 'جديد')
    assert.equal(updated!.pages[0].root.children[1].style.color, '#111111')
  })

  it('detaches a single instance without touching the others', () => {
    const heading = createNode('heading', 'h')
    const created = createComponentFromNode(projectWith(heading), 'h')
    const withCopy = insertComponentInstance(
      created!.project,
      created!.component.id,
      created!.project.pages[0].root.id,
    )
    const firstId = withCopy!.project.pages[0].root.children[0].id
    const detached = detachInstance(withCopy!.project, firstId)
    assert.ok(detached)
    assert.equal(detached!.pages[0].root.children[0].componentId, undefined)
    assert.equal(detached!.pages[0].root.children[1].componentId, created!.component.id)
    assert.equal(detached!.components.length, 1)
  })

  it('renames uniquely and deleting a component unlinks remaining instances', () => {
    const project = createProject()
    assert.equal(uniqueComponentName(project, 'بطاقة'), 'بطاقة')
    const heading = createNode('heading', 'h')
    const created = createComponentFromNode(projectWith(heading), 'h', undefined, 'بطاقة')
    const renamed = renameComponent(created!.project, created!.component.id, 'بطاقة')
    assert.equal(renamed!.components[0].name, 'بطاقة')
    const second = createComponentFromNode(
      { ...renamed!, pages: [{ ...renamed!.pages[0], root: { ...renamed!.pages[0].root, children: [createNode('text', 't')] } }] },
      't',
      undefined,
      'بطاقة',
    )
    assert.equal(second!.component.name, 'بطاقة 2')
    const removed = deleteComponent(created!.project, created!.component.id)
    assert.ok(removed)
    assert.equal(removed!.components.length, 0)
    assert.equal(findNode(removed!.pages[0].root, created!.project.pages[0].root.children[0].id)?.componentId, undefined)
  })
})
