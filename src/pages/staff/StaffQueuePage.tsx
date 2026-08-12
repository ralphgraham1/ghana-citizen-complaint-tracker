import { useAuth } from '@/hooks/useAuth'
import { useDepartmentComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'

export function StaffQueuePage() {
  const { profile } = useAuth()
  const { complaints, loading } = useDepartmentComplaints(profile?.department_id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Department queue</h1>
      {complaints.length === 0 && <p className="text-muted-foreground">No complaints assigned to your department yet.</p>}
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/staff/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
