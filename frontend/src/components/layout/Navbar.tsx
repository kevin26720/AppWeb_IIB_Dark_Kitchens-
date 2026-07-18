import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { Role } from '@darkitchen/shared'
import styles from './Navbar.module.css'

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore()
  const { itemCount, toggleCart } = useCartStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className={styles.navbar} id="main-navbar">
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 28 }}>
            restaurant
          </span>
          <span>Dark<span style={{ color: 'var(--color-primary)' }}>itchen</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.links}>
          <Link to="/" className={`${styles.link} ${isActive('/') ? styles.linkActive : ''}`}>Inicio</Link>
          <Link to="/catalog" className={`${styles.link} ${isActive('/catalog') ? styles.linkActive : ''}`}>Catálogo</Link>
          {isAuthenticated && user?.role === Role.CLIENT && (
            <Link to="/orders" className={`${styles.link} ${isActive('/orders') ? styles.linkActive : ''}`}>Mis Pedidos</Link>
          )}
          {isAuthenticated && user?.role === Role.ADMIN && (
            <Link to="/admin" className={`${styles.link} ${isActive('/admin') ? styles.linkActive : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>admin_panel_settings</span>
              Admin
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {isAuthenticated && user?.role === Role.CLIENT && (
            <Link to="/chat" className="btn btn-ghost btn-sm" id="chat-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
              Chat
            </Link>
          )}

          {isAuthenticated && user?.role === Role.CLIENT && (
            <button className={styles.cartBtn} onClick={toggleCart} id="cart-btn" aria-label="Carrito">
              <span className="material-symbols-outlined">shopping_cart</span>
              {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
            </button>
          )}

          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <button
                className={styles.userBtn}
                onClick={() => setMenuOpen(!menuOpen)}
                id="user-menu-btn"
              >
                <div className={styles.avatar}>
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user?.name.split(' ')[0]}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {menuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                    <span className={`badge ${user?.role === Role.ADMIN ? 'badge-amber' : 'badge-green'}`}>
                      {user?.role}
                    </span>
                  </div>
                  <hr className="divider" style={{ margin: '8px 0' }} />
                  <button className={styles.dropdownItem} onClick={handleLogout} id="logout-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-secondary btn-sm" id="login-btn">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary btn-sm btn-pill" id="register-btn">Registrarse</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
            id="mobile-menu-btn"
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/catalog" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Catálogo</Link>
          {isAuthenticated && user?.role === Role.CLIENT && (
            <>
              <Link to="/orders" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Mis Pedidos</Link>
              <Link to="/chat" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Chat</Link>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link to="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
              <Link to="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
