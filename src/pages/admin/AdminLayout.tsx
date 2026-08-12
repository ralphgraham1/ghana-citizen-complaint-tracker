import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/admin/complaints', label: 'Complaints' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/staff', label: 'Staff' },
  { to: '/admin/analytics', label: 'Analytics' },
]

export function AdminLayout() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Admin</h1>
      <div className="mb-6 flex gap-4 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `pb-2 text-sm ${isActive ? 'border-b-2 border-primary font-medium' : 'text-muted-foreground'}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
