import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import styles from './RegisterPage.module.css'

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
const strengthColors = ['', '#ff4444', '#ff9944', '#ffc174', '#4edea3']

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()

  const [isSuccess, setIsSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const strength = getPasswordStrength(password)

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!name.trim()) errors.name = 'El nombre es requerido'
    if (!email) errors.email = 'El email es requerido'
    if (password.length < 8) errors.password = 'Mínimo 8 caracteres'
    if (password !== confirm) errors.confirm = 'Las contraseñas no coinciden'
    return errors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    try {
      await registerUser({ name, email, password })
      setIsSuccess(true)
    } catch {
      // handled by store
    }
  }

  const rules = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
    { label: 'Carácter especial', ok: /[^A-Za-z0-9]/.test(password) },
  ]

  return (
    <div className={styles.root}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.glowOrb} />
        <div className={styles.leftContent}>
          <h1 className={`display-lg ${styles.heroTitle}`}>
            Dark<span className={styles.accent}>Kitchen</span>
          </h1>
          <p className={`body-lg ${styles.heroSub}`}>
            Únete a miles de amantes de la gastronomía.<br />
            Descubre sabores únicos hoy.
          </p>
          <div className={styles.perks}>
            {[['🚀', 'Envío ultrarrápido'], ['🍽️', '+50 platos únicos'], ['💳', 'Pago seguro'], ['⭐', 'Reseñas verificadas']].map(([icon, text]) => (
              <div key={text} className={styles.perkItem}>
                <span className={styles.perkIcon}>{icon}</span>
                <span className={styles.perkText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.foodVisual}>
          <div className={styles.foodOrb}>
            <span style={{ fontSize: 80 }}>🥗</span>
          </div>
          <div className={`${styles.foodChip} ${styles.chip1}`}><span>🚀</span> Envío gratis</div>
          <div className={`${styles.foodChip} ${styles.chip2}`}><span>⭐</span> Top picks</div>
          <div className={`${styles.foodChip} ${styles.chip3}`}><span>🍽️</span> +50 platos</div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        <div className={`glass-card ${styles.formCard} animate-fade-in`}>
          <div className={styles.formLogo}>
            <span className={styles.logoIcon}>🍳</span>
            <span className={styles.logoText}>DarkKitchen</span>
          </div>

          <h2 className={`headline-lg ${styles.formTitle}`}>Crear cuenta</h2>
          <p className={`body-md ${styles.formSubtitle}`}>Empieza tu experiencia gastronómica</p>

          {isSuccess && (
            <div className={styles.successBanner} style={{ backgroundColor: 'rgba(78, 222, 163, 0.1)', color: '#4edea3', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', border: '1px solid rgba(78, 222, 163, 0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              Cuenta creada con éxito. Por favor, revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.
            </div>
          )}

          {error && !isSuccess && (
            <div className={styles.errorBanner}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              {error}
            </div>
          )}

          {!isSuccess ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="input-group">
              <label className="input-label" htmlFor="reg-name">Nombre completo</label>
              <input
                id="reg-name"
                type="text"
                className="input-field"
                placeholder="Tu nombre"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <span className="input-error">{fieldErrors.name}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-email">Correo electrónico</label>
              <input
                id="reg-email"
                type="email"
                className="input-field"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <span className="input-error">{fieldErrors.email}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-password">Contraseña</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field ${styles.passwordInput}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {fieldErrors.password && <span className="input-error">{fieldErrors.password}</span>}

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className={styles.strengthSection}>
                  <div className={styles.strengthBars}>
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={styles.strengthBar}
                        style={{
                          background: i <= strength ? strengthColors[strength] : 'var(--color-surface-container-high)',
                          transition: 'background 0.3s'
                        }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}

              {/* Rules */}
              <div className={styles.rulesGrid}>
                {rules.map(r => (
                  <div key={r.label} className={`${styles.rule} ${r.ok ? styles.ruleOk : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {r.ok ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="reg-confirm">Confirmar contraseña</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className={`input-field ${styles.passwordInput}`}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                  <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {fieldErrors.confirm && <span className="input-error">{fieldErrors.confirm}</span>}
              {confirm.length > 0 && password !== confirm && (
                <span className={styles.matchError}>Las contraseñas no coinciden</span>
              )}
              {confirm.length > 0 && password === confirm && confirm.length > 0 && (
                <span className={styles.matchOk}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                  Las contraseñas coinciden
                </span>
              )}
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className={styles.spinner} />Creando cuenta...</>
              ) : 'Crear cuenta'}
            </button>
          </form>
          ) : (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Link to="/login" className={`btn btn-primary ${styles.submitBtn}`}>
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}

          <div className={styles.dividerRow}>
            <span className={styles.dividerLine} />
            <span className={`body-sm ${styles.dividerText}`}>o continúa con</span>
            <span className={styles.dividerLine} />
          </div>

          <button 
            type="button" 
            className={`btn btn-google ${styles.googleBtn}`}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/google`}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p className={`body-sm ${styles.loginLink}`}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className={styles.linkAccent}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
