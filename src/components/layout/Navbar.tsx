import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="flex items-center justify-between border-b bg-nav px-6 py-3">
      <Link to="/" className="font-semibold">
        Ghana Citizen Report
      </Link>
      <div className="flex items-center gap-3 text-sm">
        {!user && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">
              <Button size="sm">Report an issue</Button>
            </Link>
          </>
        )}
        {user && profile?.role === 'citizen' && (
          <>
            <Link to="/submit">Submit</Link>
            <Link to="/my-reports">My Reports</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
        {user && profile?.role === 'department_staff' && (
          <>
            <Link to="/staff">My Queue</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
        {user && profile?.role === 'super_admin' && (
          <>
            <Link to="/admin">Admin</Link>
            <Button size="sm" variant="outline" onClick={handleSignOut}>Log out</Button>
          </>
        )}
      </div>
    </nav>
  )
}
