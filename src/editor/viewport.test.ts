import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clampZoom,
  DEVICE_WIDTHS,
  loadViewportPrefs,
  parseViewportPrefs,
  saveViewportPrefs,
  serializeViewportPrefs,
  VIEWPORT_STORAGE_KEY,
  ZOOM_MAX,
  ZOOM_MIN,
} from './viewport.ts'

describe('clampZoom', () => {
  it('snaps to tenths and stays within bounds', () => {
    assert.equal(clampZoom(1), 1)
    assert.equal(clampZoom(0.55), 0.6)
    assert.equal(clampZoom(0.49), ZOOM_MIN)
    assert.equal(clampZoom(1.51), ZOOM_MAX)
    assert.equal(clampZoom(Number.NaN), 1)
  })
})

describe('viewport prefs', () => {
  it('parses stored device and zoom', () => {
    assert.deepEqual(parseViewportPrefs(null), { device: 'desktop', zoom: 1 })
    assert.deepEqual(parseViewportPrefs('{"device":"phone","zoom":0.8}'), {
      device: 'phone',
      zoom: 0.8,
    })
    assert.deepEqual(parseViewportPrefs('not-json'), { device: 'desktop', zoom: 1 })
    assert.deepEqual(parseViewportPrefs('{"device":"watch","zoom":9}'), {
      device: 'desktop',
      zoom: ZOOM_MAX,
    })
  })

  it('round-trips through a storage stub', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    saveViewportPrefs({ device: 'tablet', zoom: 1.2 }, storage)
    assert.equal(store.get(VIEWPORT_STORAGE_KEY), serializeViewportPrefs({ device: 'tablet', zoom: 1.2 }))
    assert.deepEqual(loadViewportPrefs(storage), { device: 'tablet', zoom: 1.2 })
  })

  it('keeps distinct device widths', () => {
    assert.equal(DEVICE_WIDTHS.desktop > DEVICE_WIDTHS.tablet, true)
    assert.equal(DEVICE_WIDTHS.tablet > DEVICE_WIDTHS.phone, true)
  })
})
