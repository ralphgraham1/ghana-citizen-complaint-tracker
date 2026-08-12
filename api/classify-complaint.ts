import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const CATEGORIES = ['pothole', 'streetlight', 'waste_bin', 'drainage', 'infrastructure', 'other'] as const
type Category = (typeof CATEGORIES)[number]

const DEPARTMENT_BY_CATEGORY: Record<Category, string> = {
  pothole: 'Roads & Highways',
  infrastructure: 'Roads & Highways',
  streetlight: 'Electricity & Streetlighting',
  waste_bin: 'Sanitation & Waste Management',
  drainage: 'Water & Drainage',
  other: 'Unassigned',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { description } = req.body ?? {}
  if (typeof description !== 'string' || description.trim().length < 5) {
    res.status(400).json({ error: 'description must be a string of at least 5 characters' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY' })
    return
  }

  try {
    const anthropic = new Anthropic({ apiKey })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system:
        'You classify Ghanaian public-infrastructure complaints into exactly one category from this fixed list: pothole, streetlight, waste_bin, drainage, infrastructure, other. Respond with ONLY the category word, nothing else.',
      messages: [{ role: 'user', content: description.slice(0, 2000) }],
    })

    const firstBlock = message.content[0]
    const text = firstBlock.type === 'text' ? firstBlock.text.trim().toLowerCase() : ''
    const category: Category = (CATEGORIES as readonly string[]).includes(text) ? (text as Category) : 'other'

    res.status(200).json({
      category,
      department: DEPARTMENT_BY_CATEGORY[category],
      confidence: category === 'other' ? 0.3 : 0.8,
    })
  } catch (err) {
    res.status(502).json({ error: 'AI classification unavailable', detail: (err as Error).message })
  }
}
