import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ChatPage } from '@/pages/ChatPage'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { AdminProducts } from '@/pages/AdminProducts'
import { AdminOrders } from '@/pages/AdminOrders'
import { AdminChat } from '@/pages/AdminChat'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@darkitchen/shared'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Navbar />
      <CartDrawer />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        {/* Auth — redirige si ya está autenticado */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        {/* OAuth callback */}
        <Route
          path="/auth/callback"
          element={<OAuthCallbackPage />}
        />

        {/* Privadas — Cliente */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Privadas — Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chat"
          element={
            <ProtectedRoute requiredRole={Role.ADMIN}>
              <AdminChat />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// OAuth Callback — procesa el token de Google
function OAuthCallbackPage() {
  const { setAuth } = useAuthStore()
  const navigate = (window as any).useNavigate?.() ?? null

  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setAuth({ token, user: { id: payload.sub || payload.id, email: payload.email, name: payload.name || payload.email?.split('@')[0] || 'Usuario', role: payload.role } })
    } catch {
      // token inválido
    }
    window.location.href = '/'
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: 40, height: 40, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px' }} />
        <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>Iniciando sesión con Google...</p>
      </div>
    </div>
  )
}

export default App
