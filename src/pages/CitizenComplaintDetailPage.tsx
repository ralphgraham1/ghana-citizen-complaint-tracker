import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { Complaint, ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { StatusHistoryTimeline } from '@/components/complaints/StatusHistoryTimeline'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'

export function CitizenComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('*').eq('complaint_id', id),
    ]).then(([complaintRes, historyRes]) => {
      setComplaint((complaintRes.data as Complaint) ?? null)
      setHistory((historyRes.data as ComplaintStatusHistory[]) ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (!complaint) return <p className="p-6 text-muted-foreground">Report not found.</p>

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{complaint.title}</h1>
        <StatusBadge status={complaint.status} />
      </div>
      <p>{complaint.description}</p>
      {complaint.photo_url && <img src={complaint.photo_url} alt="Reported issue" className="max-h-80 rounded-lg border" />}
      <ComplaintMap complaints={[complaint]} />
      <div>
        <h2 className="mb-2 font-medium">Status history</h2>
        <StatusHistoryTimeline history={history} />
      </div>
    </div>
  )
}
