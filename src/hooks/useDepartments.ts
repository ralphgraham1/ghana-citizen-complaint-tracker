import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/lib/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        setDepartments((data as Department[]) ?? [])
        setError(error?.message ?? null)
        setLoading(false)
      })
  }, [])

  return { departments, loading, error }
}
