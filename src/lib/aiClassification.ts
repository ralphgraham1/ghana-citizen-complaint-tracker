import type { ComplaintCategory } from '@/lib/types'

interface ClassificationResult {
  category: ComplaintCategory
  confidence: number
}

export async function classifyDescription(description: string): Promise<ClassificationResult | null> {
  try {
    const res = await fetch('/api/classify-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { category: data.category as ComplaintCategory, confidence: data.confidence as number }
  } catch {
    return null
  }
}
