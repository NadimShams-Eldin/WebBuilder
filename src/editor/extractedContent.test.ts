import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createNode } from './createNode.ts'
import { createDemoProject } from './demoProject.ts'
import {
  collectExtractedFields,
  extractedFieldValue,
  propsFromExtractedValue,
} from './extractedContent.ts'
import { findNode, updateNode } from './tree.ts'

describe('collectExtractedFields', () => {
  it('walks the demo home page in document order', () => {
    const project = createDemoProject()
    const fields = collectExtractedFields(project.pages[0].root)
    const texts = fields.map((field) => field.value)

    assert.ok(fields.length >= 10)
    assert.equal(fields[0].nodeType, 'heading')
    assert.equal(fields[0].key, 'text')
    assert.ok(texts.includes('أهلاً بك في قطمة'))
    assert.ok(texts.includes('تخطيط حر'))
    assert.ok(texts.includes('مصدر واحد'))
    assert.ok(texts.includes('عزل تام'))
    assert.ok(texts.includes('ابدأ البناء'))
    assert.ok(texts.includes('تعرّف على الأصول'))
    assert.ok(texts.includes('تابع التطوير'))
    assert.ok(texts.includes('بريدك الإلكتروني'))
    assert.equal(
      fields.filter((field) => field.nodeType === 'divider' || field.nodeType === 'container').length,
      0,
    )
  })

  it('extracts list items as newline-separated text', () => {
    const list = createNode('list', 'l')
    list.props = { items: ['واحد', 'اثنان'], ordered: false }
    const root = createNode('container', 'root')
    root.children = [list]
    const fields = collectExtractedFields(root)
    assert.equal(fields.length, 1)
    assert.equal(fields[0].key, 'items')
    assert.equal(fields[0].value, 'واحد\nاثنان')
    assert.equal(extractedFieldValue(list, 'items'), 'واحد\nاثنان')
  })

  it('returns no fields for layout-only trees', () => {
    const root = createNode('container', 'root')
    root.children = [createNode('flex', 'f'), createNode('divider', 'd')]
    assert.deepEqual(collectExtractedFields(root), [])
  })
})

describe('propsFromExtractedValue', () => {
  it('patches text and list items', () => {
    assert.deepEqual(propsFromExtractedValue('text', 'عنوان جديد'), { text: 'عنوان جديد' })
    assert.deepEqual(propsFromExtractedValue('items', 'أ\nب'), { items: ['أ', 'ب'] })
  })

  it('two-way bind: editing a collected field updates the matching node', () => {
    const project = createDemoProject()
    const fields = collectExtractedFields(project.pages[0].root)
    const hero = fields.find((field) => field.value === 'أهلاً بك في قطمة')
    assert.ok(hero)
    const next = updateNode(project.pages[0].root, hero.nodeId, {
      props: propsFromExtractedValue(hero.key, 'مرحبا'),
    })
    assert.ok(next)
    const node = findNode(next, hero.nodeId)
    assert.ok(node)
    assert.equal(node.props.text, 'مرحبا')
    const updated = collectExtractedFields(next).find((field) => field.id === hero.id)
    assert.equal(updated?.value, 'مرحبا')
  })
})
