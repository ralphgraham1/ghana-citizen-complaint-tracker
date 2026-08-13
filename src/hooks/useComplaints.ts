import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Complaint, PublicComplaint } from '@/lib/types'

export function useMyComplaints(citizenId: string | undefined) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!citizenId) {
      setComplaints([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('complaints').select('*').eq('citizen_id', citizenId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [citizenId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, error, refetch }
}

export function useDepartmentComplaints(departmentId: string | undefined | null) {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!departmentId) {
      setComplaints([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('complaints').select('*').eq('department_id', departmentId).order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [departmentId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, error, refetch }
}

export function useAllComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
    setComplaints((data as Complaint[]) ?? [])
    setError(error?.message ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { complaints, loading, error, refetch }
}

export function usePublicComplaints() {
  const [complaints, setComplaints] = useState<PublicComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('complaints_public')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setComplaints((data as PublicComplaint[]) ?? [])
        setError(error?.message ?? null)
        setLoading(false)
      })
  }, [])

  return { complaints, loading, error }
}
