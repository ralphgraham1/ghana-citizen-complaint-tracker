import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { ALLOWED_TRANSITIONS } from '@/lib/statusTransitions'
import type { Complaint, ComplaintComment, ComplaintStatus, ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { StatusHistoryTimeline } from '@/components/complaints/StatusHistoryTimeline'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function StaffComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([])
  const [comments, setComments] = useState<ComplaintComment[]>([])
  const [loading, setLoading] = useState(true)

  const [nextStatus, setNextStatus] = useState<ComplaintStatus | ''>('')
  const [note, setNote] = useState('')
  const [newComment, setNewComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [commenting, setCommenting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const [complaintRes, historyRes, commentsRes] = await Promise.all([
      supabase.from('complaints').select('*').eq('id', id).single(),
      supabase.from('complaint_status_history').select('*').eq('complaint_id', id),
      supabase.from('complaint_comments').select('*').eq('complaint_id', id).order('created_at'),
    ])
    setComplaint((complaintRes.data as Complaint) ?? null)
    setHistory((historyRes.data as ComplaintStatusHistory[]) ?? [])
    setComments((commentsRes.data as ComplaintComment[]) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusUpdate() {
    if (!complaint || !nextStatus) return
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.rpc('update_complaint_status', {
        p_complaint_id: complaint.id,
        p_new_status: nextStatus,
        p_note: note || null,
      })
      if (error) {
        setError(error.message)
        return
      }
      setNote('')
      setNextStatus('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while updating the status. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddComment() {
    if (!complaint || !profile || !newComment.trim()) return
    setCommenting(true)
    setError(null)
    try {
      const { error } = await supabase.from('complaint_comments').insert({
        complaint_id: complaint.id,
        author_id: profile.id,
        comment: newComment,
      })
      if (error) {
        setError(error.message)
        return
      }
      setNewComment('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while adding the note. Please try again.')
    } finally {
      setCommenting(false)
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>
  if (!complaint) return <p className="p-6 text-muted-foreground">Complaint not found or not assigned to your department.</p>

  const allowedNext = ALLOWED_TRANSITIONS[complaint.status]

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{complaint.title}</h1>
        <StatusBadge status={complaint.status} />
      </div>
      <p>{complaint.description}</p>
      {complaint.photo_url && <img src={complaint.photo_url} alt="Reported issue" className="max-h-80 rounded-lg border" />}
      <ComplaintMap complaints={[complaint]} />

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">Update status</h2>
        {allowedNext.length === 0 && <p className="text-sm text-muted-foreground">No further transitions available from this status.</p>}
        {allowedNext.length > 0 && (
          <>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ComplaintStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {allowedNext.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={handleStatusUpdate} disabled={!nextStatus || saving}>
              {saving ? 'Saving…' : 'Update status'}
            </Button>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div>
        <h2 className="mb-2 font-medium">Status history</h2>
        <StatusHistoryTimeline history={history} />
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Internal notes</h2>
        {comments.map((c) => (
          <p key={c.id} className="rounded bg-muted/50 p-2 text-sm">
            {c.comment}
          </p>
        ))}
        <Textarea placeholder="Add an internal note" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <Button variant="outline" onClick={handleAddComment} disabled={!newComment.trim() || commenting}>
          {commenting ? 'Saving…' : 'Add note'}
        </Button>
      </div>
    </div>
  )
}
