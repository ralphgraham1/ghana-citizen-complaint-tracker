import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/lib/types'

export function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>
  if (!user || !profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/" replace />

  return <Outlet />
}
