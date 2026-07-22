import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '@/api/auth.api'
import styles from './LoginPage.module.css'
import fp from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isSuccess, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) { setError('Por favor ingresa tu correo electrónico.'); return }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
    } catch {
      setError('Ocurrió un error. Por favor inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      {/* ─── Left panel ─── */}
      <div className={`${styles.leftPanel} ${fp.leftPanelOverride}`}>
        <div className={styles.glowOrb} />
        <div className={styles.leftContent}>
          <h1 className={`display-lg ${styles.heroTitle}`}>
            Dark<span className={styles.accent}>Kitchen</span>
          </h1>
          <p className={`body-lg ${fp.heroSubFP}`}>
            No te preocupes, te ayudamos a<br />recuperar el acceso a tu cuenta.
          </p>

          {/* Info cards — dentro de leftContent como las stats del login */}
          <div className={fp.infoCards}>
            <div className={fp.infoCard}>
              <span className={fp.infoIcon}>🔒</span>
              <div>
                <p className={fp.infoTitle}>Seguro y rápido</p>
                <p className={fp.infoDesc}>El enlace expira en 30 minutos</p>
              </div>
            </div>
            <div className={fp.infoCard}>
              <span className={fp.infoIcon}>📧</span>
              <div>
                <p className={fp.infoTitle}>Revisa tu bandeja</p>
                <p className={fp.infoDesc}>También en spam o correo no deseado</p>
              </div>
            </div>
          </div>
        </div>

        {/* foodVisual fuera de leftContent — igual que en LoginPage */}
        <div className={`${styles.foodVisual} ${fp.foodVisualFP}`}>
          <div className={styles.foodCircle}>
            <span className={styles.foodEmoji}>🔑</span>
          </div>
          <div className={`${styles.foodChip} ${styles.chip1}`}><span>🛡️</span> Protegido</div>
          <div className={`${styles.foodChip} ${styles.chip2}`}><span>⚡</span> Inmediato</div>
          <div className={`${styles.foodChip} ${styles.chip3}`}><span>✅</span> Seguro</div>
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className={styles.rightPanel}>
        <div className={`glass-card ${styles.formCard} animate-fade-in`}>
          {/* Logo */}
          <div className={styles.formLogo}>
            <span className={styles.logoIcon}>🍳</span>
            <span className={styles.logoText}>DarkKitchen</span>
          </div>

          {isSuccess ? (
            /* ── Pantalla de éxito ── */
            <div className={fp.successState}>
              <div className={fp.successIcon}>📬</div>
              <h2 className={`headline-lg ${styles.formTitle}`}>¡Correo enviado!</h2>
              <p className={`body-md ${fp.successDesc}`}>
                Si el correo <strong>{email}</strong> está registrado, recibirás un
                enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <div className={fp.successHint}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>info</span>
                Recuerda revisar tu carpeta de spam si no lo ves en la bandeja de entrada.
              </div>
              <Link to="/login" className={`btn btn-primary ${styles.submitBtn}`} style={{ textAlign: 'center' }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <>
              <h2 className={`headline-lg ${styles.formTitle}`}>¿Olvidaste tu contraseña?</h2>
              <p className={`body-md ${styles.formSubtitle}`}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div className={styles.errorBanner}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className="input-group">
                  <label className="input-label" htmlFor="fp-email">Correo electrónico</label>
                  <input
                    id="fp-email"
                    type="email"
                    className="input-field"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submitBtn}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#472a00', borderRadius: '50%' }} />
                      Enviando enlace...
                    </>
                  ) : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <p className={`body-sm ${styles.registerLink}`}>
                ¿Recordaste tu contraseña?{' '}
                <Link to="/login" className={styles.linkAccent}>Iniciar sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
