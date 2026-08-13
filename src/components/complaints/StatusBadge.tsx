import { motion, AnimatePresence } from 'framer-motion'
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
  submitted: 'bg-[#fdf0d9] text-[#8a5a12] dark:bg-[#3a2a12] dark:text-[#e8a33d]',
  assigned: 'bg-[#dce9f7] text-[#1d5490] dark:bg-[#14263a] dark:text-[#4a90d9]',
  in_progress: 'bg-[#fbe6d1] text-[#8f4e11] dark:bg-[#3a2712] dark:text-[#e08a3d]',
  resolved: 'bg-[#dcf3e0] text-[#227a33] dark:bg-[#1f3323] dark:text-[#5fbf6f]',
  closed: 'bg-[#eeece8] text-[#5c574e] dark:bg-[#262421] dark:text-[#9a938a]',
  rejected: 'bg-[#fce0dd] text-[#a3271e] dark:bg-[#3a1414] dark:text-[#e8635a]',
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}
      >
        {LABELS[status]}
      </motion.span>
    </AnimatePresence>
  )
}
