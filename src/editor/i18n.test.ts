import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { localeDir, parseChromePrefs } from './chromePrefs.ts'
import { missingI18nKeys, translate } from './i18n.ts'

describe('i18n', () => {
  it('covers every Arabic key in English', () => {
    assert.deepEqual(missingI18nKeys(), [])
  })

  it('returns locale-specific chrome labels', () => {
    assert.equal(translate('ar', 'tools.clear'), 'مسح الكل')
    assert.equal(translate('en', 'tools.clear'), 'Clear all')
    assert.equal(translate('en', 'missing.key'), 'missing.key')
  })
})

describe('chrome prefs', () => {
  it('parses theme and locale and maps direction', () => {
    assert.deepEqual(parseChromePrefs(null), { theme: 'light', locale: 'ar' })
    assert.deepEqual(parseChromePrefs('{"theme":"dark","locale":"en"}'), {
      theme: 'dark',
      locale: 'en',
    })
    assert.equal(localeDir('ar'), 'rtl')
    assert.equal(localeDir('en'), 'ltr')
  })
})
