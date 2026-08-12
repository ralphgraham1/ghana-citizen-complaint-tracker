import { describe, it, expect } from 'vitest'
import { isValidTransition } from '@/lib/statusTransitions'

describe('isValidTransition', () => {
  it('allows submitted -> assigned', () => {
    expect(isValidTransition('submitted', 'assigned')).toBe(true)
  })

  it('allows submitted -> rejected', () => {
    expect(isValidTransition('submitted', 'rejected')).toBe(true)
  })

  it('disallows submitted -> resolved (must go through assigned/in_progress)', () => {
    expect(isValidTransition('submitted', 'resolved')).toBe(false)
  })

  it('allows resolved -> closed', () => {
    expect(isValidTransition('resolved', 'closed')).toBe(true)
  })

  it('allows resolved -> in_progress (reopen)', () => {
    expect(isValidTransition('resolved', 'in_progress')).toBe(true)
  })

  it('disallows any transition out of closed', () => {
    expect(isValidTransition('closed', 'in_progress')).toBe(false)
  })

  it('disallows any transition out of rejected', () => {
    expect(isValidTransition('rejected', 'assigned')).toBe(false)
  })
})
