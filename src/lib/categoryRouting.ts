import type { ComplaintCategory, Department } from '@/lib/types'

export const CATEGORY_TO_DEPARTMENT_NAME: Record<ComplaintCategory, string | null> = {
  pothole: 'Roads & Highways',
  infrastructure: 'Roads & Highways',
  streetlight: 'Electricity & Streetlighting',
  waste_bin: 'Sanitation & Waste Management',
  drainage: 'Water & Drainage',
  other: null,
}

export function suggestDepartmentId(category: ComplaintCategory, departments: Department[]): string | null {
  const name = CATEGORY_TO_DEPARTMENT_NAME[category]
  if (!name) return null
  return departments.find((d) => d.name === name)?.id ?? null
}
