import { useState } from 'react'
import { useAllComplaints } from '@/hooks/useComplaints'
import { useDepartments } from '@/hooks/useDepartments'
import { supabase } from '@/lib/supabaseClient'
import { StatusBadge } from '@/components/complaints/StatusBadge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AdminComplaintsPage() {
  const { complaints, loading, refetch } = useAllComplaints()
  const { departments } = useDepartments()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAssign(complaintId: string, departmentId: string) {
    setSavingId(complaintId)
    setError(null)
    try {
      const { error } = await supabase.rpc('assign_complaint', {
        p_complaint_id: complaintId,
        p_department_id: departmentId,
        p_staff_id: null,
        p_note: null,
      })
      if (error) {
        setError(error.message)
        return
      }
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while assigning the complaint. Please try again.')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {complaints.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.title}</TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell>
                <Select
                  value={c.department_id ?? ''}
                  onValueChange={(v) => handleAssign(c.id, v)}
                  disabled={savingId === c.id}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
