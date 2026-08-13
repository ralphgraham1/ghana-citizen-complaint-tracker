import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useDepartments } from '@/hooks/useDepartments'
import type { Profile } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function AdminStaffPage() {
  const { departments } = useDepartments()
  const [staff, setStaff] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'department_staff').order('full_name')
      if (error) {
        setError(error.message)
        return
      }
      setStaff((data as Profile[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while loading staff. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDepartmentChange(staffId: string, departmentId: string) {
    setError(null)
    setUpdatingId(staffId)
    try {
      const { error } = await supabase.from('profiles').update({ department_id: departmentId }).eq('id', staffId)
      if (error) {
        setError(error.message)
        return
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while reassigning the department. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Staff accounts are created via the seed script (or Supabase Studio) — see the User Manual. This page lets you reassign an existing
        staff member to a different department.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.full_name}</TableCell>
              <TableCell>
                <Select
                  value={s.department_id ?? ''}
                  onValueChange={(v) => handleDepartmentChange(s.id, v)}
                  disabled={updatingId === s.id}
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
