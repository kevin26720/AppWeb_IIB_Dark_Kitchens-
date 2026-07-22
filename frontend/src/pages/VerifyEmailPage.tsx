import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail } from '@/api/auth.api';
import styles from './VerifyEmailPage.module.css';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se proporcionó un token de verificación.');
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || err.message || 'Error al verificar el correo.');
      });
  }, [token]);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={`glass-card ${styles.card} animate-fade-in`}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🍳</span>
            <span className={styles.logoText}>DarkKitchen</span>
          </div>

          {status === 'loading' && (
            <div className={styles.content}>
              <span className={styles.spinner} />
              <h2 className="headline-md">Verificando...</h2>
              <p className="body-md">Estamos confirmando tu correo electrónico.</p>
            </div>
          )}

          {status === 'success' && (
            <div className={styles.content}>
              <div className={styles.successIcon}>
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h2 className="headline-md">¡Correo Verificado!</h2>
              <p className="body-md">{message}</p>
              <Link to="/login" className={`btn btn-primary ${styles.btn}`}>
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.content}>
              <div className={styles.errorIcon}>
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <h2 className="headline-md">Hubo un problema</h2>
              <p className="body-md">{message}</p>
              <button 
                onClick={() => navigate('/register')} 
                className={`btn btn-secondary ${styles.btn}`}
              >
                Volver al Registro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
