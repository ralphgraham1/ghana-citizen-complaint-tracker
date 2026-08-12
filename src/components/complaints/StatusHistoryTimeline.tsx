import type { ComplaintStatusHistory } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

export function StatusHistoryTimeline({ history }: { history: ComplaintStatusHistory[] }) {
  const sorted = [...history].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <ol className="space-y-3">
      {sorted.map((entry) => (
        <li key={entry.id} className="border-l-2 border-muted pl-3">
          <StatusBadge status={entry.new_status} />
          <p className="mt-1 text-sm text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
          {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}
