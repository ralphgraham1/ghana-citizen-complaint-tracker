import type { ComplaintStatus } from '@/lib/types'

const LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
}

const CLASSES: Record<ComplaintStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>{LABELS[status]}</span>
}
