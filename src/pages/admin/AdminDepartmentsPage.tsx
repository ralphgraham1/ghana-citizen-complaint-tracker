import { useState, type FormEvent } from 'react'
import { useDepartments } from '@/hooks/useDepartments'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function AdminDepartmentsPage() {
  const { departments, loading } = useDepartments()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const { error } = await supabase.from('departments').insert({ name, description: description || null })
      if (error) {
        setError(error.message)
        return
      }
      setName('')
      setDescription('')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while adding the department. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell>{d.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <form onSubmit={handleCreate} className="max-w-sm space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Add department</h2>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  )
}
