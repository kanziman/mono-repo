import { describe, expect, it } from 'vitest'
import resolveConfig from 'tailwindcss/resolveConfig'
import config from '../../../../design-system/tailwind.config'

const resolved = resolveConfig(config)
const extend = config.theme?.extend ?? {}

describe('design-system Tailwind spacing contract', () => {
  it('preserves Tailwind base numeric spacing values', () => {
    expect(resolved.theme.spacing['8']).toBe('2rem')
    expect(resolved.theme.spacing['10']).toBe('2.5rem')
    expect(resolved.theme.spacing['12']).toBe('3rem')
  })

  it('exposes design-system pixel spacing through ds-* keys only', () => {
    expect(resolved.theme.spacing['ds-8']).toBe('var(--spacing-8)')
    expect(resolved.theme.spacing['ds-10']).toBe('var(--spacing-10)')
    expect(resolved.theme.spacing['ds-12']).toBe('var(--spacing-12)')
  })
})

describe('design-system Tailwind base-key collision audit', () => {
  it('does not override numeric Tailwind spacing keys', () => {
    const spacing = extend.spacing ?? {}
    const numericKeys = Object.keys(spacing).filter((key) => /^\d+$/.test(key))
    expect(numericKeys).toEqual([])
  })

  it('documents every intentional Tailwind base-key override', () => {
    const intentionalOverrideKeys = [
      'borderRadius',
      'boxShadow',
      'colors',
      'fontFamily',
      'fontSize',
      'transitionDuration',
      'transitionTimingFunction',
      'zIndex',
    ].sort()
    const auditedKeys = Object.keys(extend)
      .filter((key) => key !== 'spacing' && key !== 'keyframes' && key !== 'animation')
      .sort()
    expect(auditedKeys).toEqual(intentionalOverrideKeys)
  })
})
