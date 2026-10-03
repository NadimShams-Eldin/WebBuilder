import { createId, createNode } from './createNode.ts'
import type { Page, Project, Theme } from './types.ts'

export const DEFAULT_THEME: Theme = {
  fontFamily: 'system-ui, sans-serif',
  backgroundColor: '#ffffff',
  textColor: '#171717',
  direction: 'rtl',
}

export function createPage(name = 'الصفحة الرئيسية', slug = 'index'): Page {
  return {
    id: createId('p'),
    name,
    slug,
    root: createNode('container'),
  }
}

export function createProject(name = 'مشروع جديد'): Project {
  return {
    id: createId('prj'),
    name,
    theme: { ...DEFAULT_THEME },
    pages: [createPage()],
    assets: [],
  }
}
