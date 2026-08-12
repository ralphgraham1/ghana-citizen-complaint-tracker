import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Complaint, PublicComplaint } from '@/lib/types'

export function useMyComplaints(citizenId: string | undefined) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!citizenId) return
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').eq('citizen_id', citizenId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [citizenId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function useDepartmentComplaints(departmentId: string | undefined | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').eq('department_id', departmentId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [departmentId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function useAllComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, refetch }
}

export function usePublicComplaints() {
  const [complaints, setComplaints] = useState<PublicComplaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('complaints_public')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setComplaints((data as PublicComplaint[]) ?? [])
        setLoading(false)
      })
  }, [])

  return { complaints, loading }
}
