import { useAuth } from '@/hooks/useAuth'
import { useMyComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'

export function MyReportsPage() {
  const { user } = useAuth()
  const { complaints, loading } = useMyComplaints(user?.id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">My Reports</h1>
      {complaints.length === 0 && <p className="text-muted-foreground">You haven't reported anything yet.</p>}
      <div className="space-y-3">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/my-reports/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
