import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Department } from '@/lib/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setDepartments((data as Department[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { departments, loading }
}
