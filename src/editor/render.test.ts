import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { filterStyle, isAllowedCssProp, toKebabCase } from './cssWhitelist.ts'
import { createNode, isContainerType, resetNodeIdSeq } from './createNode.ts'
import { createProject } from './createProject.ts'
import { renderCss, renderHtml } from './render.ts'
import type { Node, Project } from './types.ts'

function tree(): Node {
  return {
    id: 'root',
    type: 'container',
    name: 'حاوية',
    props: {},
    style: {
      display: 'block',
      width: '100%',
      maxWidth: '72rem',
      marginInline: 'auto',
      padding: '1rem',
    },
    animation: null,
    children: [
      {
        id: 'h1',
        type: 'heading',
        name: 'عنوان',
        props: { text: 'مرحبا', level: 1 },
        style: { fontSize: '2rem', fontWeight: 700, color: '#111111' },
        animation: null,
        children: [],
      },
      {
        id: 'p1',
        type: 'text',
        name: 'نص',
        props: { text: 'فقرة تجريبية' },
        style: { fontSize: '1rem' },
        animation: null,
        children: [],
      },
      {
        id: 'btn',
        type: 'button',
        name: 'زر',
        props: { text: 'ابدأ', type: 'button' },
        style: { backgroundColor: '#2563eb', color: '#ffffff' },
        animation: null,
        children: [],
      },
    ],
  }
}

function projectWith(root: Node): Project {
  return {
    id: 'prj',
    name: 'اختبار',
    theme: {
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#ffffff',
      textColor: '#171717',
      direction: 'rtl',
    },
    pages: [{ id: 'p1', name: 'رئيسية', slug: 'index', root }],
    assets: [],
  }
}

describe('createNode', () => {
  beforeEach(() => {
    resetNodeIdSeq()
  })

  it('sets defaults per type', () => {
    const heading = createNode('heading', 'h')
    assert.equal(heading.type, 'heading')
    assert.equal(heading.props.text, 'عنوان')
    assert.equal(heading.props.level, 2)
    assert.deepEqual(heading.children, [])

    const flex = createNode('flex', 'f')
    assert.equal(flex.style.display, 'flex')
    assert.equal(flex.style.gap, '1rem')

    const input = createNode('input', 'i')
    assert.equal(input.props.inputType, 'text')
  })

  it('marks only container types as parents', () => {
    assert.equal(isContainerType('container'), true)
    assert.equal(isContainerType('flex'), true)
    assert.equal(isContainerType('grid'), true)
    assert.equal(isContainerType('form'), true)
    assert.equal(isContainerType('heading'), false)
    assert.equal(isContainerType('button'), false)
  })
})

describe('css whitelist', () => {
  it('accepts classified props and kebab-cases them', () => {
    assert.equal(isAllowedCssProp('flexDirection'), true)
    assert.equal(isAllowedCssProp('backgroundColor'), true)
    assert.equal(isAllowedCssProp('onclick'), false)
    assert.equal(toKebabCase('backgroundColor'), 'background-color')
    assert.equal(toKebabCase('gridTemplateColumns'), 'grid-template-columns')
  })

  it('drops unknown style keys', () => {
    const filtered = filterStyle({
      color: 'red',
      width: '10px',
      behavior: 'malicious',
      expression: '1+1',
    })
    assert.deepEqual(filtered, [
      ['width', '10px'],
      ['color', 'red'],
    ])
  })
})

describe('renderHtml', () => {
  it('renders a simple tree to expected HTML', () => {
    const html = renderHtml(tree())
    assert.equal(
      html,
      '<div class="q-root" data-qid="root" data-qtype="container">' +
        '<h1 class="q-h1" data-qid="h1" data-qtype="heading">مرحبا</h1>' +
        '<p class="q-p1" data-qid="p1" data-qtype="text">فقرة تجريبية</p>' +
        '<button class="q-btn" data-qid="btn" data-qtype="button" type="button">ابدأ</button>' +
        '</div>',
    )
  })

  it('escapes HTML in text content and attributes', () => {
    const node: Node = {
      id: 'x',
      type: 'text',
      name: 'نص',
      props: { text: '<script>alert(1)</script>' },
      style: {},
      animation: null,
      children: [],
    }
    assert.ok(renderHtml(node).includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
    assert.equal(renderHtml(node).includes('<script>'), false)

    const image: Node = {
      id: 'img',
      type: 'image',
      name: 'صورة',
      props: { src: 'https://ex.com/a.png', alt: '" onerror="alert(1)' },
      style: {},
      animation: null,
      children: [],
    }
    assert.ok(renderHtml(image).includes('alt="&quot; onerror=&quot;alert(1)"'))
  })

  it('renders list, link, form and input variants', () => {
    const list: Node = {
      id: 'l',
      type: 'list',
      name: 'قائمة',
      props: { items: ['أ', 'ب'], ordered: true },
      style: {},
      animation: null,
      children: [],
    }
    assert.equal(
      renderHtml(list),
      '<ol class="q-l" data-qid="l" data-qtype="list"><li>أ</li><li>ب</li></ol>',
    )

    const link: Node = {
      id: 'a',
      type: 'link',
      name: 'رابط',
      props: { text: 'خارجي', href: 'https://ex.com', target: '_blank' },
      style: {},
      animation: null,
      children: [],
    }
    const linkHtml = renderHtml(link)
    assert.ok(linkHtml.includes('target="_blank"'))
    assert.ok(linkHtml.includes('rel="noopener noreferrer"'))

    const form: Node = {
      id: 'f',
      type: 'form',
      name: 'نموذج',
      props: { action: '/send', method: 'post' },
      style: {},
      animation: null,
      children: [
        {
          id: 'in',
          type: 'input',
          name: 'حقل',
          props: { inputType: 'email', name: 'email', placeholder: 'بريد' },
          style: {},
          animation: null,
          children: [],
        },
      ],
    }
    const formHtml = renderHtml(form)
    assert.ok(formHtml.includes('<form class="q-f"'))
    assert.ok(formHtml.includes('action="/send"'))
    assert.ok(formHtml.includes('type="email"'))
    assert.ok(formHtml.includes('name="email"'))
  })
})

describe('renderCss', () => {
  it('emits theme rules and node class declarations', () => {
    const css = renderCss(projectWith(tree()))
    assert.ok(css.includes('direction: rtl'))
    assert.ok(css.includes('background: #ffffff'))
    assert.ok(
      css.includes(
        '.q-root { display: block; width: 100%; max-width: 72rem; margin-inline: auto; padding: 1rem; }',
      ),
    )
    assert.ok(css.includes('.q-h1 { font-size: 2rem; font-weight: 700; color: #111111; }'))
    assert.ok(css.includes('.q-btn { color: #ffffff; background-color: #2563eb; }'))
    assert.equal(css.includes('onclick'), false)
  })
})

describe('createProject', () => {
  it('creates a project with a container root page', () => {
    resetNodeIdSeq()
    const project = createProject('قطمة')
    assert.equal(project.name, 'قطمة')
    assert.equal(project.pages.length, 1)
    assert.equal(project.pages[0].root.type, 'container')
    assert.equal(project.theme.direction, 'rtl')
  })
})
