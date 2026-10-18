export const DEMO_QUERY_PARAM = 'demo'

export function isDemoRequest(search: string): boolean {
  const value = new URLSearchParams(search).get(DEMO_QUERY_PARAM)
  return value === '1' || value === 'true'
}

export function withDemoHref(href: string): string {
  const url = new URL(href, 'http://localhost')
  url.searchParams.set(DEMO_QUERY_PARAM, '1')
  return `${url.pathname}${url.search}${url.hash}`
}

export function withoutDemoHref(href: string): string {
  const url = new URL(href, 'http://localhost')
  url.searchParams.delete(DEMO_QUERY_PARAM)
  return `${url.pathname}${url.search}${url.hash}`
}
