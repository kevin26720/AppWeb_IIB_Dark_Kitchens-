import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import styles from './AdminSidebar.module.css'

interface NavItem {
  path: string
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/products', icon: 'restaurant_menu', label: 'Productos' },
  { path: '/admin/orders', icon: 'receipt_long', label: 'Pedidos' },
  { path: '/admin/chat', icon: 'forum', label: 'Chat' },
]

import { useState } from 'react'

export default function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Botón flotante para abrir sidebar en móviles */}
      <button 
        className={styles.mobileToggleBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle admin menu"
      >
        <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Overlay oscuro cuando el menú está abierto en móvil */}
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <div className={styles.logoIcon}>🍳</div>
        <div className={styles.logoText}>
          <span className={styles.logoName}>DarkKitchen</span>
          <span className={`badge badge-amber ${styles.adminBadge}`}>ADMIN</span>
        </div>
      </div>

      <hr className="divider" style={{ margin: '0 0 16px' }} />

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.userAvatar}>
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className={styles.userInfo}>
          <p className={styles.userName}>{user?.name || 'Administrador'}</p>
          <p className={styles.userEmail}>{user?.email || ''}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <p className={`label-md ${styles.navSectionLabel}`}>Menú Principal</p>
        {NAV_ITEMS.map(item => {
          const isActive = item.path === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && <span className={styles.activeIndicator} />}
            </Link>
          )
        })}
      </nav>

      <div className={styles.sidebarBottom}>
        <Link to="/catalog" className={styles.backLink}>
          <span className="material-symbols-outlined">storefront</span>
          Ver catálogo
        </Link>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  )
}
