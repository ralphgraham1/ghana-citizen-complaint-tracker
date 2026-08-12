import { describe, it, expect } from 'vitest'
import { suggestDepartmentId } from '@/lib/categoryRouting'
import type { Department } from '@/lib/types'

const departments: Department[] = [
  { id: '1', name: 'Roads & Highways', description: null },
  { id: '2', name: 'Electricity & Streetlighting', description: null },
  { id: '3', name: 'Sanitation & Waste Management', description: null },
  { id: '4', name: 'Water & Drainage', description: null },
]

describe('suggestDepartmentId', () => {
  it('routes pothole to Roads & Highways', () => {
    expect(suggestDepartmentId('pothole', departments)).toBe('1')
  })

  it('routes infrastructure to Roads & Highways', () => {
    expect(suggestDepartmentId('infrastructure', departments)).toBe('1')
  })

  it('routes streetlight to Electricity & Streetlighting', () => {
    expect(suggestDepartmentId('streetlight', departments)).toBe('2')
  })

  it('routes waste_bin to Sanitation & Waste Management', () => {
    expect(suggestDepartmentId('waste_bin', departments)).toBe('3')
  })

  it('routes drainage to Water & Drainage', () => {
    expect(suggestDepartmentId('drainage', departments)).toBe('4')
  })

  it('returns null for category "other"', () => {
    expect(suggestDepartmentId('other', departments)).toBeNull()
  })

  it('returns null when the matching department is missing from the list', () => {
    expect(suggestDepartmentId('pothole', [])).toBeNull()
  })
})
