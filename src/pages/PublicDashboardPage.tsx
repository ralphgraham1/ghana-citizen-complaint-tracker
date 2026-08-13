import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { usePublicComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CATEGORY_LABELS } from '@/lib/categoryRouting'
import { listContainerVariants } from '@/lib/motionVariants'
import type { ComplaintCategory, ComplaintStatus } from '@/lib/types'

const STATUS_OPTIONS: (ComplaintStatus | 'all')[] = ['all', 'submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']
const CATEGORY_OPTIONS: (ComplaintCategory | 'all')[] = ['all', ...(Object.keys(CATEGORY_LABELS) as ComplaintCategory[])]

export function PublicDashboardPage() {
  const { complaints, loading, error } = usePublicComplaints()
  const { departments } = useDepartments()
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all')

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (departmentFilter !== 'all' && c.department_id !== departmentFilter) return false
        if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
        return true
      }),
    [complaints, statusFilter, departmentFilter, categoryFilter]
  )

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Public accountability dashboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">Every reported issue and its current status — no login required.</p>
      {error && <p className="mb-4 text-sm text-destructive">Couldn't load reports: {error}</p>}

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ComplaintStatus | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ComplaintCategory | 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c === 'all' ? 'All categories' : CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ComplaintMap complaints={filtered} />

      <motion.div
        className="mt-6 grid gap-3 sm:grid-cols-2"
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/complaints/${c.id}`} />
        ))}
      </motion.div>
    </div>
  )
}
