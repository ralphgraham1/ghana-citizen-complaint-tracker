import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SubmitComplaintPage } from '@/pages/SubmitComplaintPage'
import { MyReportsPage } from '@/pages/MyReportsPage'
import { CitizenComplaintDetailPage } from '@/pages/CitizenComplaintDetailPage'
import { PublicDashboardPage } from '@/pages/PublicDashboardPage'
import { PublicComplaintDetailPage } from '@/pages/PublicComplaintDetailPage'
import { StaffQueuePage } from '@/pages/staff/StaffQueuePage'
import { StaffComplaintDetailPage } from '@/pages/staff/StaffComplaintDetailPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDepartmentsPage } from '@/pages/admin/AdminDepartmentsPage'
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicDashboardPage />} />
        <Route path="/complaints/:id" element={<PublicComplaintDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="/submit" element={<SubmitComplaintPage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/my-reports/:id" element={<CitizenComplaintDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['department_staff']} />}>
          <Route path="/staff" element={<StaffQueuePage />} />
          <Route path="/staff/:id" element={<StaffComplaintDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="departments" element={<AdminDepartmentsPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

export default App
