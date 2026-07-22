import { useState, FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import * as authApi from '@/api/auth.api'
import styles from './LoginPage.module.css'
import rp from './ResetPasswordPage.module.css'
import reg from './RegisterPage.module.css'

function getPasswordStrength(pwd: string): number {
  let s = 0
  if (pwd.length >= 8)          s++
  if (/[A-Z]/.test(pwd))        s++
  if (/[0-9]/.test(pwd))        s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  return s
}

const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
const strengthColors = ['', '#ff4444', '#ff9944', '#ffc174', '#4edea3']

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPassword, setShowPass]     = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [isLoading, setLoading]         = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [isSuccess, setSuccess]         = useState(false)

  const strength = getPasswordStrength(password)
  const rules = [
    { label: '8+ caracteres',    ok: password.length >= 8 },
    { label: 'Una mayúscula',    ok: /[A-Z]/.test(password) },
    { label: 'Un número',        ok: /[0-9]/.test(password) },
    { label: 'Carácter especial', ok: /[^A-Za-z0-9]/.test(password) },
  ]

  if (!token) {
    return (
      <div className={styles.root}>
        <div className={`${styles.leftPanel} ${rp.leftPanelOverride}`}>
          <div className={styles.glowOrb} />
          <div className={styles.leftContent}>
            <h1 className={`display-lg ${styles.heroTitle}`}>Dark<span className={styles.accent}>Kitchen</span></h1>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <div className={`glass-card ${styles.formCard} animate-fade-in`}>
            <div className={styles.formLogo}>
              <span className={styles.logoIcon}>🍳</span>
              <span className={styles.logoText}>DarkKitchen</span>
            </div>
            <div className={rp.invalidToken}>
              <span style={{ fontSize: 48 }}>⚠️</span>
              <h2 className={`headline-lg ${styles.formTitle}`}>Enlace inválido</h2>
              <p className={`body-md ${styles.formSubtitle}`}>
                Este enlace no es válido o ha caducado. Solicita uno nuevo.
              </p>
              <Link to="/forgot-password" className={`btn btn-primary ${styles.submitBtn}`} style={{ textAlign: 'center' }}>
                Solicitar nuevo enlace
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (strength < 4) {
      setError('La contraseña no cumple los requisitos de seguridad.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'El enlace es inválido o ha caducado. Solicita uno nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>
      {/* ─── Left panel ─── */}
      <div className={`${styles.leftPanel} ${rp.leftPanelOverride}`}>
        <div className={styles.glowOrb} />
        <div className={styles.leftContent}>
          <h1 className={`display-lg ${styles.heroTitle}`}>
            Dark<span className={styles.accent}>Kitchen</span>
          </h1>
          <p className={`body-lg ${rp.heroSubRP}`}>
            Elige una contraseña segura<br />para proteger tu cuenta.
          </p>
          <div className={rp.tipsList}>
            {[
              { icon: '🔡', text: '8 caracteres mínimo' },
              { icon: '🔢', text: 'Al menos un número' },
              { icon: '🔠', text: 'Una letra mayúscula' },
              { icon: '✳️', text: 'Un carácter especial (!@#...)' },
            ].map(t => (
              <div key={t.text} className={rp.tipItem}>
                <span>{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.foodVisual} ${rp.foodVisualRP}`}>
          <div className={styles.foodCircle}>
            <span className={styles.foodEmoji}>🔐</span>
          </div>
          <div className={`${styles.foodChip} ${styles.chip1}`}><span>🛡️</span> Seguro</div>
          <div className={`${styles.foodChip} ${styles.chip2}`}><span>⚡</span> Rápido</div>
          <div className={`${styles.foodChip} ${styles.chip3}`}><span>✅</span> Listo</div>
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className={styles.rightPanel}>
        <div className={`glass-card ${styles.formCard} animate-fade-in`}>
          <div className={styles.formLogo}>
            <span className={styles.logoIcon}>🍳</span>
            <span className={styles.logoText}>DarkKitchen</span>
          </div>

          {isSuccess ? (
            <div className={rp.successState}>
              <div className={rp.successIcon}>🎉</div>
              <h2 className={`headline-lg ${styles.formTitle}`}>¡Contraseña actualizada!</h2>
              <p className={`body-md`} style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <button
                className={`btn btn-primary ${styles.submitBtn}`}
                onClick={() => navigate('/login')}
              >
                Ir al inicio de sesión
              </button>
            </div>
          ) : (
            <>
              <h2 className={`headline-lg ${styles.formTitle}`}>Nueva contraseña</h2>
              <p className={`body-md ${styles.formSubtitle}`}>Ingresa y confirma tu nueva contraseña.</p>

              {error && (
                <div className={styles.errorBanner}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Nueva contraseña */}
                <div className="input-group">
                  <label className="input-label" htmlFor="rp-password">Nueva contraseña</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="rp-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`input-field ${styles.passwordInput}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                      <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>

                  {/* Strength indicator — idéntico al Register */}
                  {password.length > 0 && (
                    <div className={reg.strengthSection}>
                      <div className={reg.strengthBars}>
                        {[1,2,3,4].map(i => (
                          <div
                            key={i}
                            className={reg.strengthBar}
                            style={{
                              background: i <= strength ? strengthColors[strength] : 'var(--color-surface-container-high)',
                              transition: 'background 0.3s'
                            }}
                          />
                        ))}
                      </div>
                      <span className={reg.strengthLabel} style={{ color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}

                  {/* Rules — idéntico al Register */}
                  <div className={reg.rulesGrid}>
                    {rules.map(r => (
                      <div key={r.label} className={`${reg.rule} ${r.ok ? reg.ruleOk : ''}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {r.ok ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="input-group">
                  <label className="input-label" htmlFor="rp-confirm">Confirmar contraseña</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="rp-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className={`input-field ${styles.passwordInput} ${confirmPassword && password !== confirmPassword ? rp.inputError : ''}`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                      <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {/* Feedback de coincidencia — idéntico al Register */}
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <span className={reg.matchError}>Las contraseñas no coinciden</span>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <span className={reg.matchOk}>
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
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#472a00', borderRadius: '50%' }} />
                      Actualizando...
                    </>
                  ) : 'Cambiar contraseña'}
                </button>
              </form>

              <p className={`body-sm ${styles.registerLink}`}>
                <Link to="/login" className={styles.linkAccent}>← Volver al inicio de sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
