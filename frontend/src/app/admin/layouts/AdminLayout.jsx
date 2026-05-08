import { Link, Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { clearAdminTokens } from '../../../lib/auth/adminAuth'
import { useEffect } from 'react'

export default function AdminLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    try {
      document.documentElement.lang = 'en'
      document.documentElement.dir = 'ltr'
    } catch (e) {}
  }, [])

  function handleLogout() {
    clearAdminTokens()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <main className="page-shell" style={{ paddingTop: 24, paddingBottom: 32, flex:1 }}>
        <section className="panel admin-shell" style={{ marginBottom: 20 }}>
          <div className="admin-topbar">
            <div>
              <h1 className="section-title">Admin dashboard</h1>
              <p className="muted">Catalog, orders, imports, and WhatsApp actions.</p>
            </div>
            <nav className="chip admin-nav" aria-label="Admin navigation">
              <Link to="/admin">Overview</Link>
              <Link to="/admin/catalog">Catalog</Link>
              <Link to="/admin/orders">Orders</Link>
              <button className="btn secondary" type="button" onClick={handleLogout}>Logout</button>
            </nav>
          </div>
        </section>
        <Outlet />
      </main>
    </div>
  )
}
