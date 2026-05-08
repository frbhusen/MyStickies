import { Link, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCart } from '../../../features/cart/cartStore'
import Footer from '../../../components/ui/Footer'
import { t } from '../../../lib/i18n'
import Logo from '../../../assets/logo.png'

export default function StorefrontLayout() {
  const [count, setCount] = useState(() => getCart().reduce((s, i) => s + (i.quantity || 0), 0))

  useEffect(() => {
    function onCartUpdated(e) {
      try {
        setCount(e.detail?.count ?? getCart().reduce((s, i) => s + (i.quantity || 0), 0))
      } catch (err) {
        setCount(getCart().reduce((s, i) => s + (i.quantity || 0), 0))
      }
    }

    function onStorage(e) {
      if (e.key === 'my-stickies-cart') {
        setCount(getCart().reduce((s, i) => s + (i.quantity || 0), 0))
      }
    }

    try {
      document.documentElement.lang = 'ar'
      document.documentElement.dir = 'rtl'
    } catch (e) {}

    window.addEventListener('cart-updated', onCartUpdated)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('cart-updated', onCartUpdated)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <header className="topbar">
        <div className="page-shell topbar-inner">
          <Link className="brand" to="/">
            <span className="brand-mark brand-mark--logo">
              <img src={Logo} alt={t('brand')} />
            </span>
          </Link>
          <nav className="chip nav-chip" aria-label="Primary">
            <Link to="/">{t('nav_home')}</Link>
            <Link to="/shop">{t('nav_products')}</Link>
            <Link to="/checkout" aria-label="Cart" title="Cart" className="nav-cart-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 3h2l.4 2M7 13h10l3-7H6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="19" r="1.2" fill="currentColor"/>
                <circle cx="18" cy="19" r="1.2" fill="currentColor"/>
              </svg>
              {count > 0 ? (<span className="cart-badge" aria-hidden>{count}</span>) : null}
              <span className="visually-hidden">{t('nav_cart')} {count}</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="page-shell" style={{flex:1}}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
