import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SubmitComplaintPage } from '@/pages/SubmitComplaintPage'

function ComingSoon({ label }: { label: string }) {
  return <div className="p-8 text-muted-foreground">{label} — coming soon.</div>
}

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<ComingSoon label="Public dashboard" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="/submit" element={<SubmitComplaintPage />} />
          <Route path="/my-reports" element={<ComingSoon label="My reports" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department_staff']} />}>
          <Route path="/staff" element={<ComingSoon label="Staff queue" />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/admin" element={<ComingSoon label="Admin dashboard" />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
