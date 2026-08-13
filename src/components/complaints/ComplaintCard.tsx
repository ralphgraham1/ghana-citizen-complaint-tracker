import { Link } from 'react-router-dom'
import type { Complaint, PublicComplaint } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/categoryRouting'
import { StatusBadge } from './StatusBadge'

export function ComplaintCard({ complaint, to }: { complaint: Complaint | PublicComplaint; to: string }) {
  return (
    <Link to={to} className="block rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{complaint.title}</h3>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{CATEGORY_LABELS[complaint.category]}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {complaint.address_text ?? `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
    </Link>
  )
}
