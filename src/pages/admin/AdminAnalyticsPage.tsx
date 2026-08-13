import { useMemo } from 'react'
import { useAllComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComplaintStatus } from '@/lib/types'

const STATUSES: ComplaintStatus[] = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']

export function AdminAnalyticsPage() {
  const { complaints, loading } = useAllComplaints()
  const { departments } = useDepartments()

  const byStatus = useMemo(() => {
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<ComplaintStatus, number>
    for (const c of complaints) counts[c.status]++
    return counts
  }, [complaints])

  const byDepartment = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of departments) counts[d.id] = 0
    for (const c of complaints) if (c.department_id) counts[c.department_id] = (counts[c.department_id] ?? 0) + 1
    return counts
  }, [complaints, departments])

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {STATUSES.map((s) => (
            <div key={s} className="flex justify-between text-sm">
              <span className="capitalize text-muted-foreground">{s.replace('_', ' ')}</span>
              <span className="font-medium">{byStatus[s]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By department</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {departments.map((d) => (
            <div key={d.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium">{byDepartment[d.id] ?? 0}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
