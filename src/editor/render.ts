import { ANIMATION_SCRIPT, hasScrollAnimation, normalizeAnimation, renderAnimationCss } from './animation.ts'
import { filterStyle, toKebabCase } from './cssWhitelist.ts'
import { resolveMediaSrc } from './assets.ts'
import { pageFileName, resolveHref } from './pages.ts'
import type { Node, NodeStyle, Page, Project } from './types.ts'

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

function animationAttrs(node: Node): string {
  const animation = normalizeAnimation(node.animation)
  if (!animation) return ''
  return `${attr('data-qanim', animation.trigger)}${attr('data-qeffect', animation.effect)}`
}

function openTag(tag: string, node: Node, extra = ''): string {
  const cls = classNameFor(node.id)
  return `<${tag} class="${cls}" data-qid="${escapeAttr(node.id)}" data-qtype="${node.type}"${animationAttrs(node)}${extra}>`
}

function voidTag(tag: string, node: Node, extra = ''): string {
  const cls = classNameFor(node.id)
  return `<${tag} class="${cls}" data-qid="${escapeAttr(node.id)}" data-qtype="${node.type}"${animationAttrs(node)}${extra} />`
}

function renderChildren(node: Node, project?: Project, resolveLinks = false): string {
  return node.children.map((child) => renderHtml(child, project, resolveLinks)).join('')
}

export function renderHtml(node: Node, project?: Project, resolveLinks = false): string {
  const p = node.props

  switch (node.type) {
    case 'container':
    case 'flex':
    case 'grid':
      return `${openTag('div', node)}${renderChildren(node, project, resolveLinks)}</div>`
    case 'form':
      return `${openTag('form', node, `${attr('action', p.action ?? '')}${attr('method', p.method ?? 'post')}`)}${renderChildren(node, project, resolveLinks)}</form>`
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
    case 'link': {
      const href = resolveLinks && project ? resolveHref(project, p.href) : (p.href ?? '#')
      return `${openTag('a', node, `${attr('href', href)}${attr('target', p.target)}${p.target === '_blank' ? ' rel="noopener noreferrer"' : ''}`)}${escapeHtml(p.text ?? '')}</a>`
    }
    case 'image':
      return voidTag(
        'img',
        node,
        `${attr('src', resolveMediaSrc(project, p.src))}${attr('alt', p.alt ?? '')}`,
      )
    case 'icon':
      return `${openTag('span', node, `${attr('role', 'img')}${attr('aria-label', p.label ?? '')}`)}${escapeHtml(p.text ?? '')}</span>`
    case 'video':
      return `${openTag('video', node, `${attr('src', resolveMediaSrc(project, p.src))}${attr('poster', resolveMediaSrc(project, p.poster))}${attr('controls', p.controls !== false)}${attr('autoplay', p.autoplay)}${attr('loop', p.loop)}`)}</video>`
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
  const animationCss = renderAnimationCss(project)
  if (animationCss) lines.push(animationCss)
  return lines.join('\n')
}

const EDITOR_SCRIPT = `<script>
(function () {
  document.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    var target = event.target;
    var link = target && target.closest ? target.closest('a[href]') : null;
    var href = link ? link.getAttribute('href') || '' : '';
    if (href.indexOf('page:') === 0) {
      window.parent.postMessage({ source: 'qitma-canvas', type: 'navigate', pageId: href.slice(5) }, '*');
      return;
    }
    var el = target && target.closest ? target.closest('[data-qid]') : null;
    var id = el ? el.getAttribute('data-qid') : null;
    window.parent.postMessage({ source: 'qitma-canvas', type: 'select', id: id }, '*');
  }, true);
  document.addEventListener('submit', function (event) { event.preventDefault(); }, true);
})();
</script>`

export function renderPageHtml(
  project: Project,
  node: Node,
  editor = false,
  page?: Page,
): string {
  const title = page?.name || project.name
  return `<!DOCTYPE html>
<html lang="ar" dir="${project.theme.direction}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<style>
${renderCss(project)}
</style>
</head>
<body>
${renderHtml(node, project, !editor)}
${editor ? EDITOR_SCRIPT : ''}
${hasScrollAnimation(node) ? ANIMATION_SCRIPT : ''}
</body>
</html>`
}

export type ExportedPage = {
  fileName: string
  html: string
}

export function renderExportedPages(project: Project): ExportedPage[] {
  return project.pages.map((page) => ({
    fileName: pageFileName(page),
    html: renderPageHtml(project, page.root, false, page),
  }))
}
