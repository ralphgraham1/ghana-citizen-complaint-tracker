import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useMyComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { listContainerVariants } from '@/lib/motionVariants'

export function MyReportsPage() {
  const { user } = useAuth()
  const { complaints, loading, error } = useMyComplaints(user?.id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">My Reports</h1>
      {error && <p className="mb-4 text-sm text-destructive">Couldn't load your reports: {error}</p>}
      {!error && complaints.length === 0 && <p className="text-muted-foreground">You haven't reported anything yet.</p>}
      <motion.div className="space-y-3" variants={listContainerVariants} initial="hidden" animate="visible">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/my-reports/${c.id}`} />
        ))}
      </motion.div>
    </div>
  )
}
