import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/catalog'

  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      // error handled by store
    }
  }

  return (
    <div className={styles.root}>
      {/* Left panel - visual */}
      <div className={styles.leftPanel}>
        <div className={styles.glowOrb} />
        <div className={styles.leftContent}>
          <div className={styles.brandMark}>
            <span className={styles.brandIcon}>🍳</span>
          </div>
          <h1 className={`display-lg ${styles.heroTitle}`}>
            Dark<span className={styles.accent}>Kitchen</span>
          </h1>
          <p className={`body-lg ${styles.heroSub}`}>
            La mejor experiencia gastronómica,
            <br />directo a tu puerta.
          </p>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>1.2k+</span>
              <span className={styles.statLabel}>Clientes felices</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>50+</span>
              <span className={styles.statLabel}>Platos únicos</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>4.9★</span>
              <span className={styles.statLabel}>Rating promedio</span>
            </div>
          </div>
        </div>
        <div className={styles.foodVisual}>
          <div className={styles.foodCircle}>
            <span className={styles.foodEmoji}>🥘</span>
          </div>
          <div className={`${styles.foodChip} ${styles.chip1}`}>
            <span>🌮</span> Tacos al pastor
          </div>
          <div className={`${styles.foodChip} ${styles.chip2}`}>
            <span>⭐</span> Nuevo hoy
          </div>
          <div className={`${styles.foodChip} ${styles.chip3}`}>
            <span>🔥</span> Trending
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className={styles.rightPanel}>
        <div className={`glass-card ${styles.formCard} animate-fade-in`}>
          {/* Logo */}
          <div className={styles.formLogo}>
            <span className={styles.logoIcon}>🍳</span>
            <span className={styles.logoText}>DarkKitchen</span>
          </div>

          <h2 className={`headline-lg ${styles.formTitle}`}>Bienvenido de vuelta</h2>
          <p className={`body-md ${styles.formSubtitle}`}>Inicia sesión para continuar</p>

          {/* Error */}
          {error && (
            <div className={styles.errorBanner}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Contraseña</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${styles.passwordInput}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className={styles.forgotRow}>
              <Link to="/forgot-password" className={styles.forgotLink}>¿Olvidaste tu contraseña?</Link>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="animate-spin" style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#472a00', borderRadius:'50%' }} />Iniciando sesión...</>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={`body-sm ${styles.dividerText}`}>o continúa con</span>
            <span className={styles.dividerLine} />
          </div>

          <button type="button" className={`btn btn-google ${styles.googleBtn}`}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p className={`body-sm ${styles.registerLink}`}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className={styles.linkAccent}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
