import { filterStyle, toKebabCase } from './cssWhitelist.ts'
import type { Node, NodeStyle, Project } from './types.ts'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value)
}

function classNameFor(id: string): string {
  return `q-${id}`
}

function styleToDeclarations(style: NodeStyle): string {
  return filterStyle(style)
    .map(([prop, value]) => `${toKebabCase(prop)}: ${value}`)
    .join('; ')
}

function attr(name: string, value: string | number | boolean | undefined): string {
  if (value === undefined || value === false) return ''
  if (value === true) return ` ${name}`
  return ` ${name}="${escapeAttr(String(value))}"`
}

function openTag(tag: string, node: Node, extra = ''): string {
  const cls = classNameFor(node.id)
  return `<${tag} class="${cls}" data-qid="${escapeAttr(node.id)}" data-qtype="${node.type}"${extra}>`
}

function voidTag(tag: string, node: Node, extra = ''): string {
  const cls = classNameFor(node.id)
  return `<${tag} class="${cls}" data-qid="${escapeAttr(node.id)}" data-qtype="${node.type}"${extra} />`
}

function renderChildren(node: Node): string {
  return node.children.map(renderHtml).join('')
}

export function renderHtml(node: Node): string {
  const p = node.props

  switch (node.type) {
    case 'container':
    case 'flex':
    case 'grid':
      return `${openTag('div', node)}${renderChildren(node)}</div>`
    case 'form':
      return `${openTag('form', node, `${attr('action', p.action ?? '')}${attr('method', p.method ?? 'post')}`)}${renderChildren(node)}</form>`
    case 'spacer':
      return openTag('div', node) + '</div>'
    case 'divider':
      return voidTag('hr', node)
    case 'heading': {
      const level = p.level && p.level >= 1 && p.level <= 6 ? p.level : 2
      const tag = `h${level}`
      return `${openTag(tag, node)}${escapeHtml(p.text ?? '')}</${tag}>`
    }
    case 'text':
      return `${openTag('p', node)}${escapeHtml(p.text ?? '')}</p>`
    case 'list': {
      const tag = p.ordered ? 'ol' : 'ul'
      const items = (p.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')
      return `${openTag(tag, node)}${items}</${tag}>`
    }
    case 'link':
      return `${openTag('a', node, `${attr('href', p.href ?? '#')}${attr('target', p.target)}${p.target === '_blank' ? ' rel="noopener noreferrer"' : ''}`)}${escapeHtml(p.text ?? '')}</a>`
    case 'image':
      return voidTag('img', node, `${attr('src', p.src ?? '')}${attr('alt', p.alt ?? '')}`)
    case 'icon':
      return `${openTag('span', node, `${attr('role', 'img')}${attr('aria-label', p.label ?? '')}`)}${escapeHtml(p.text ?? '')}</span>`
    case 'video':
      return `${openTag('video', node, `${attr('src', p.src ?? '')}${attr('poster', p.poster)}${attr('controls', p.controls !== false)}${attr('autoplay', p.autoplay)}${attr('loop', p.loop)}`)}</video>`
    case 'button':
      return `${openTag('button', node, attr('type', p.type ?? 'button'))}${escapeHtml(p.text ?? '')}</button>`
    case 'input': {
      const inputType = p.inputType ?? 'text'
      if (inputType === 'textarea') {
        return `${openTag('textarea', node, `${attr('name', p.name)}${attr('placeholder', p.placeholder)}`)}${escapeHtml(p.value ?? '')}</textarea>`
      }
      if (inputType === 'select') {
        const options = (p.options ?? [])
          .map((option) => {
            const selected = option === p.value ? ' selected' : ''
            return `<option value="${escapeAttr(option)}"${selected}>${escapeHtml(option)}</option>`
          })
          .join('')
        return `${openTag('select', node, attr('name', p.name))}${options}</select>`
      }
      if (inputType === 'checkbox' || inputType === 'radio') {
        const extra = `${attr('type', inputType)}${attr('name', p.name)}${attr('value', p.value)}${attr('checked', p.checked)}`
        return voidTag('input', node, extra)
      }
      return voidTag(
        'input',
        node,
        `${attr('type', inputType)}${attr('name', p.name)}${attr('placeholder', p.placeholder)}${attr('value', p.value)}`,
      )
    }
  }
}

export function renderCss(project: Project): string {
  const lines: string[] = [
    `html, body { margin: 0; padding: 0; font-family: ${project.theme.fontFamily}; background: ${project.theme.backgroundColor}; color: ${project.theme.textColor}; direction: ${project.theme.direction}; }`,
    '*, *::before, *::after { box-sizing: border-box; }',
    'img, video { max-width: 100%; height: auto; }',
  ]

  const seen = new Set<string>()

  const walk = (node: Node) => {
    if (!seen.has(node.id)) {
      seen.add(node.id)
      const declarations = styleToDeclarations(node.style)
      if (declarations) {
        lines.push(`.${classNameFor(node.id)} { ${declarations}; }`)
      }
    }
    for (const child of node.children) walk(child)
  }

  for (const page of project.pages) walk(page.root)
  return lines.join('\n')
}

const EDITOR_SCRIPT = `<script>
(function () {
  document.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    var target = event.target;
    var el = target && target.closest ? target.closest('[data-qid]') : null;
    var id = el ? el.getAttribute('data-qid') : null;
    window.parent.postMessage({ source: 'qitma-canvas', type: 'select', id: id }, '*');
  }, true);
  document.addEventListener('submit', function (event) { event.preventDefault(); }, true);
})();
</script>`

export function renderPageHtml(project: Project, node: Node, editor = false): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="${project.theme.direction}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(project.name)}</title>
<style>
${renderCss(project)}
</style>
</head>
<body>
${renderHtml(node)}
${editor ? EDITOR_SCRIPT : ''}
</body>
</html>`
}
