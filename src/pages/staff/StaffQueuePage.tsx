import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useDepartmentComplaints } from '@/hooks/useComplaints'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { listContainerVariants } from '@/lib/motionVariants'

export function StaffQueuePage() {
  const { profile } = useAuth()
  const { complaints, loading, error } = useDepartmentComplaints(profile?.department_id)

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Department queue</h1>
      {error && <p className="mb-4 text-sm text-red-600">Couldn't load the queue: {error}</p>}
      {!profile?.department_id && !error && (
        <p className="mb-4 text-sm text-amber-600">Your account isn't assigned to a department yet — contact an administrator.</p>
      )}
      {!error && complaints.length === 0 && <p className="text-muted-foreground">No complaints assigned to your department yet.</p>}
      <motion.div className="space-y-3" variants={listContainerVariants} initial="hidden" animate="visible">
        {complaints.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/staff/${c.id}`} />
        ))}
      </motion.div>
    </div>
  )
}
