import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import type { PublicComplaint } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'

interface PublicHistoryEntry {
  new_status: PublicComplaint['status']
  created_at: string
}

export function PublicComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [complaint, setComplaint] = useState<PublicComplaint | null>(null)
  const [history, setHistory] = useState<PublicHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('complaints_public').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('new_status, created_at').eq('complaint_id', id).order('created_at'),
    ]).then(([complaintRes, historyRes]) => {
      setComplaint((complaintRes.data as PublicComplaint) ?? null)
      setHistory((historyRes.data as PublicHistoryEntry[]) ?? [])
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
        <h2 className="mb-2 font-medium">Timeline</h2>
        <ol className="space-y-2">
          {history.map((h, i) => (
            <li key={i} className="border-l-2 border-muted pl-3 text-sm">
              <StatusBadge status={h.new_status} /> <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
