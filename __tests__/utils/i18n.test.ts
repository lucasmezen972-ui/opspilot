import { describe, it, expect } from 'vitest'
import { setLocale, t } from '../../utils/i18n'

describe('i18n', () => {
  it('returns translations based on current locale', () => {
    setLocale('fr')
    expect(t('invalidEmail')).toBe('Email invalide')
    setLocale('en')
    expect(t('invalidEmail')).toBe('Invalid email')
  })
})
