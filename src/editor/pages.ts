import { createPage } from './createProject.ts'
import type { Page, Project } from './types.ts'

export function findPage(project: Project, pageId: string | null | undefined): Page | undefined {
  if (!pageId) return undefined
  return project.pages.find((page) => page.id === pageId)
}

export function resolvePage(project: Project, pageId?: string | null): Page | undefined {
  return findPage(project, pageId) ?? project.pages[0]
}

export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'page'
}

export function uniqueSlug(pages: Page[], desired: string, excludeId?: string): string {
  const base = slugify(desired)
  const taken = new Set(pages.filter((page) => page.id !== excludeId).map((page) => page.slug))
  if (!taken.has(base)) return base
  let index = 2
  while (taken.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

export function pageFileName(page: Page): string {
  return `${page.slug || 'page'}.html`
}

export const PAGE_HREF_PREFIX = 'page:'

export function isInternalHref(href: string | undefined): boolean {
  return Boolean(href?.startsWith(PAGE_HREF_PREFIX))
}

export function internalHref(pageId: string): string {
  return `${PAGE_HREF_PREFIX}${pageId}`
}

export function parseInternalHref(href: string | undefined): string | null {
  if (!isInternalHref(href) || !href) return null
  const id = href.slice(PAGE_HREF_PREFIX.length)
  return id || null
}

export function resolveHref(project: Project, href: string | undefined): string {
  const pageId = parseInternalHref(href)
  if (!pageId) return href && href.length > 0 ? href : '#'
  const page = findPage(project, pageId)
  return page ? pageFileName(page) : '#'
}

export function addPageToProject(
  project: Project,
  name: string,
): { project: Project; page: Page } {
  const page = createPage(name, uniqueSlug(project.pages, name))
  return {
    project: { ...project, pages: [...project.pages, page] },
    page,
  }
}

export function removePageFromProject(
  project: Project,
  pageId: string,
): { project: Project; activePageId: string } | null {
  if (project.pages.length <= 1) return null
  const index = project.pages.findIndex((page) => page.id === pageId)
  if (index < 0) return null
  const pages = project.pages.filter((page) => page.id !== pageId)
  const fallback = pages[Math.max(0, index - 1)]
  return {
    project: { ...project, pages },
    activePageId: fallback.id,
  }
}

export function renamePageInProject(
  project: Project,
  pageId: string,
  name: string,
): Project | null {
  const page = findPage(project, pageId)
  if (!page) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const generated = slugify(page.name)
  const keepSlug = page.slug === 'index' || page.slug !== generated
  const slug = keepSlug ? page.slug : uniqueSlug(project.pages, trimmed, pageId)
  return {
    ...project,
    pages: project.pages.map((item) =>
      item.id === pageId ? { ...item, name: trimmed, slug } : item,
    ),
  }
}

export function setPageSlugInProject(
  project: Project,
  pageId: string,
  slug: string,
): Project | null {
  const page = findPage(project, pageId)
  if (!page) return null
  const next = uniqueSlug(project.pages, slug, pageId)
  return {
    ...project,
    pages: project.pages.map((item) => (item.id === pageId ? { ...item, slug: next } : item)),
  }
}
