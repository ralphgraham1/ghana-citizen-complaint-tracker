import { useMemo, useState } from 'react'
import { usePublicComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { ComplaintCard } from '@/components/complaints/ComplaintCard'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { ComplaintStatus } from '@/lib/types'

const STATUS_OPTIONS: (ComplaintStatus | 'all')[] = ['all', 'submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']

export function PublicDashboardPage() {
  const { complaints, loading } = usePublicComplaints()
  const { departments } = useDepartments()
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false
        if (departmentFilter !== 'all' && c.department_id !== departmentFilter) return false
        return true
      }),
    [complaints, statusFilter, departmentFilter]
  )

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold">Public accountability dashboard</h1>
      <p className="mb-4 text-sm text-muted-foreground">Every reported issue and its current status — no login required.</p>

      <div className="mb-4 flex gap-3">
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
      </div>

      <ComplaintMap complaints={filtered} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => (
          <ComplaintCard key={c.id} complaint={c} to={`/complaints/${c.id}`} />
        ))}
      </div>
    </div>
  )
}
