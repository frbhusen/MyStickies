import { Navigate, Outlet } from 'react-router-dom'
import { isAdminAuthenticated } from '../../../lib/auth/adminAuth'

export default function RequireAdmin() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }
  return <Outlet />
}
