import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEMO_QUERY_PARAM,
  isDemoRequest,
  withDemoHref,
  withoutDemoHref,
} from './demoMode.ts'

describe('isDemoRequest', () => {
  it('accepts the demo flag in its two forms', () => {
    assert.equal(isDemoRequest('?demo=1'), true)
    assert.equal(isDemoRequest('?foo=bar&demo=true'), true)
    assert.equal(isDemoRequest('?demo=1&page=about'), true)
  })

  it('rejects missing or unrelated values', () => {
    assert.equal(isDemoRequest(''), false)
    assert.equal(isDemoRequest('?demo=0'), false)
    assert.equal(isDemoRequest('?other=demo'), false)
  })
})

describe('demo href helpers', () => {
  it('adds the demo flag while keeping the rest of the URL', () => {
    assert.equal(withDemoHref('/?page=about'), `/?page=about&${DEMO_QUERY_PARAM}=1`)
    assert.equal(withDemoHref('/index.html'), `/index.html?${DEMO_QUERY_PARAM}=1`)
  })

  it('removes the demo flag and leaves other params intact', () => {
    assert.equal(withoutDemoHref('/?demo=1&page=about'), '/?page=about')
    assert.equal(withoutDemoHref('/?demo=1'), '/')
    assert.equal(withoutDemoHref('/index.html?demo=true#top'), '/index.html#top')
  })
})
