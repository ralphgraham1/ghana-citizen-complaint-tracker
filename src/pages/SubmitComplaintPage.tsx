import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDepartments } from '@/hooks/useDepartments'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { classifyDescription } from '@/lib/aiClassification'
import { suggestDepartmentId } from '@/lib/categoryRouting'
import { supabase } from '@/lib/supabaseClient'
import type { ComplaintCategory } from '@/lib/types'
import { ComplaintMap } from '@/components/complaints/ComplaintMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  pothole: 'Pothole',
  streetlight: 'Broken streetlight',
  waste_bin: 'Overflowing waste bin',
  drainage: 'Drainage problem',
  infrastructure: 'Damaged public infrastructure',
  other: 'Other',
}

export function SubmitComplaintPage() {
  const { user } = useAuth()
  const { departments } = useDepartments()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ComplaintCategory>('other')
  const [aiSuggestion, setAiSuggestion] = useState<{ category: ComplaintCategory; confidence: number } | null>(null)
  const [addressText, setAddressText] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedDescription = useDebouncedValue(description, 800)

  useEffect(() => {
    if (debouncedDescription.trim().length < 15) return
    let cancelled = false
    classifyDescription(debouncedDescription).then((result) => {
      if (cancelled || !result) return
      setAiSuggestion(result)
      setCategory(result.category)
    })
    return () => {
      cancelled = true
    }
  }, [debouncedDescription])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!location) {
      setError('Please click the map to mark the location of the issue.')
      return
    }
    setSubmitting(true)
    setError(null)

    if (photoFile && (!photoFile.type.startsWith('image/') || photoFile.size > 5 * 1024 * 1024)) {
      setSubmitting(false)
      setError('Photo must be an image file under 5MB.')
      return
    }

    try {
      let photoUrl: string | null = null
      if (photoFile) {
        const path = `${user.id}/${crypto.randomUUID()}-${photoFile.name}`
        const { error: uploadError } = await supabase.storage.from('complaint-photos').upload(path, photoFile)
        if (uploadError) {
          setError(`Photo upload failed: ${uploadError.message}`)
          return
        }
        photoUrl = supabase.storage.from('complaint-photos').getPublicUrl(path).data.publicUrl
      }

      const departmentId = suggestDepartmentId(category, departments)

      const { error: insertError } = await supabase.from('complaints').insert({
        citizen_id: user.id,
        category,
        title,
        description,
        photo_url: photoUrl,
        latitude: location.lat,
        longitude: location.lng,
        address_text: addressText || null,
        department_id: departmentId,
        ai_suggested_category: aiSuggestion?.category ?? null,
        ai_confidence: aiSuggestion?.confidence ?? null,
      })

      if (insertError) {
        setError(insertError.message)
        return
      }
      navigate('/my-reports')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while submitting your report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Report an issue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          {aiSuggestion && (
            <p className="mt-1 text-xs text-muted-foreground">
              AI suggested category: <strong>{CATEGORY_LABELS[aiSuggestion.category]}</strong> — review and change it below if it's wrong.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="address">Landmark / address (optional)</Label>
          <Input id="address" value={addressText} onChange={(e) => setAddressText(e.target.value)} />
        </div>

        <div>
          <Label>Location — click the map to mark the issue</Label>
          <ComplaintMap pickable pickedLocation={location} onPick={(lat, lng) => setLocation({ lat, lng })} />
        </div>

        <div>
          <Label htmlFor="photo">Photo (optional)</Label>
          <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Submitting…' : 'Submit report'}
        </Button>
      </form>
    </div>
  )
}
