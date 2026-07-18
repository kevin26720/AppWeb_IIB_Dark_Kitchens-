import { Link } from 'react-router-dom'
import styles from './HomePage.module.css'

const STATS = [
  { icon: 'groups', label: '+500 PYMEs', desc: 'confían en nuestra logística' },
  { icon: 'star', label: '4.9/5', desc: 'calificación promedio' },
  { icon: 'local_shipping', label: '2h', desc: 'tiempo de entrega promedio' },
]

const FEATURES = [
  {
    icon: 'menu_book',
    title: 'Catálogo Premium',
    desc: 'Más de 100 platillos gourmet elaborados por chefs certificados, actualizados según la temporada.',
  },
  {
    icon: 'timer',
    title: 'Pedidos en Tiempo Real',
    desc: 'Sigue el estado de tu orden desde que sale de nuestra cocina hasta la puerta de tu empresa.',
  },
  {
    icon: 'chat',
    title: 'Chat con el Chef',
    desc: 'Comunícate directamente con nuestro equipo para personalizar cada detalle de tu evento.',
  },
  {
    icon: 'verified',
    title: 'Calidad Garantizada',
    desc: 'Ingredientes frescos seleccionados diariamente. Cadena de frío certificada en cada entrega.',
  },
]

const MENU_HIGHLIGHTS = [
  {
    name: 'Menú Ejecutivo de Asado',
    category: 'Platos Fuertes',
    price: 28.50,
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
    tag: 'Más Pedido',
    tagColor: 'badge-amber',
  },
  {
    name: 'Paella Valenciana',
    category: 'Platos Fuertes',
    price: 32.00,
    img: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600&q=80',
    tag: 'Chef\'s Choice',
    tagColor: 'badge-green',
  },
  {
    name: 'Carpaccio de Res',
    category: 'Entradas',
    price: 18.00,
    img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
    tag: 'Nuevo',
    tagColor: 'badge-blue',
  },
]

export const HomePage = () => {
  return (
    <main className="page-wrapper">

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroContent}>
            <span className="badge badge-amber animate-pulse-soft" style={{ marginBottom: 24 }}>
              Soluciones Corporativas
            </span>
            <h1 className={`display-lg ${styles.heroTitle}`}>
              Catering inteligente<br />
              <span style={{ color: 'var(--color-primary)' }}>a un solo clic.</span>
            </h1>
            <p className={`body-lg ${styles.heroDesc}`}>
              Agilidad, inmediatez y excelencia culinaria diseñada para la oficina moderna.
              Elevamos tus eventos corporativos con logística impecable.
            </p>
            <div className={styles.heroCta}>
              <Link to="/catalog" className="btn btn-primary btn-lg glow-hover neo-shadow" id="hero-catalog-btn">
                Explorar Catálogo
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg" id="hero-register-btn">
                Ver Planes PYME
              </Link>
            </div>

            {/* Social proof */}
            <div className={styles.socialProof}>
              <div className={styles.avatarStack}>
                {['A','B','C'].map((l, i) => (
                  <div key={i} className={styles.proofAvatar}>{l}</div>
                ))}
              </div>
              <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>+500 PYMEs</span>{' '}
                confían en nuestra logística diaria
              </p>
            </div>
          </div>

          {/* Hero visual */}
          <div className={styles.heroVisual}>
            <div className={`glass-card ${styles.heroCard} neo-shadow animate-pulse-soft`}>
              <div className={styles.heroCardImg} style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80)',
              }} />
              <div className={styles.heroCardOverlay}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="live-dot" />
                  <span className="label-md" style={{ color: 'var(--color-secondary)' }}>EN PREPARACIÓN</span>
                </div>
                <p className="headline-sm" style={{ color: 'var(--color-text-primary)', margin: '8px 0 4px' }}>
                  Menú Ejecutivo × 12
                </p>
                <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Entrega estimada: 14:30 hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s) => (
              <div key={s.label} className={`glass-card ${styles.statCard}`}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 32 }}>
                  {s.icon}
                </span>
                <div>
                  <p className="headline-md" style={{ color: 'var(--color-text-primary)' }}>{s.label}</p>
                  <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.featuresSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label-md" style={{ color: 'var(--color-primary)' }}>¿Por qué Darkitchen?</span>
            <h2 className="headline-lg" style={{ color: 'var(--color-text-primary)', marginTop: 8 }}>
              Todo lo que necesitas en un solo lugar
            </h2>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={`card card-hover ${styles.featureCard}`}>
                <div className={styles.featureIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-primary)' }}>
                    {f.icon}
                  </span>
                </div>
                <h3 className="headline-sm" style={{ color: 'var(--color-text-primary)', margin: '16px 0 8px' }}>
                  {f.title}
                </h3>
                <p className="body-sm" style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menu Highlights ── */}
      <section className={styles.menuSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label-md" style={{ color: 'var(--color-primary)' }}>Menú Destacado</span>
            <h2 className="headline-lg" style={{ color: 'var(--color-text-primary)', marginTop: 8 }}>
              Los favoritos de nuestros clientes
            </h2>
          </div>
          <div className={styles.menuGrid}>
            {MENU_HIGHLIGHTS.map((item) => (
              <div key={item.name} className={`${styles.menuCard} product-card neo-shadow-sm glow-hover`}>
                <div className={styles.menuCardImgWrapper}>
                  <img
                    src={item.img}
                    alt={item.name}
                    className={`${styles.menuCardImg} product-card-img`}
                  />
                  <span className={`badge ${item.tagColor} ${styles.menuCardTag}`}>{item.tag}</span>
                </div>
                <div className={styles.menuCardBody}>
                  <p className="label-md" style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {item.category}
                  </p>
                  <h3 className="headline-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {item.name}
                  </h3>
                  <div className={styles.menuCardFooter}>
                    <span className="headline-sm" style={{ color: 'var(--color-primary)' }}>
                      ${item.price.toFixed(2)}
                    </span>
                    <Link to="/catalog" className="btn btn-primary btn-sm">
                      Ver más
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/catalog" className="btn btn-primary btn-pill btn-lg glow-hover" id="see-all-btn">
              Ver catálogo completo
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={`glass-card ${styles.ctaBanner}`}>
            <div className={styles.ctaGlow} aria-hidden="true" />
            <div className={styles.ctaContent}>
              <span className="label-md" style={{ color: 'var(--color-primary)' }}>Empieza hoy mismo</span>
              <h2 className="headline-lg" style={{ color: 'var(--color-text-primary)', marginTop: 8 }}>
                ¿Listo para elevar tus eventos corporativos?
              </h2>
              <p className="body-lg" style={{ color: 'var(--color-text-muted)', marginTop: 12, maxWidth: 500 }}>
                Regístrate gratis y accede a más de 100 platillos gourmet con entrega garantizada para tu empresa.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg btn-pill glow-hover neo-shadow" id="cta-register-btn">
                  Crear cuenta gratis
                  <span className="material-symbols-outlined">rocket_launch</span>
                </Link>
                <Link to="/catalog" className="btn btn-secondary btn-lg" id="cta-catalog-btn">
                  Explorar menú
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div>
              <p className="headline-sm" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-headline)' }}>
                Dark<span style={{ color: 'var(--color-text-primary)' }}>itchen</span>
              </p>
              <p className="body-sm" style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
                Catering corporativo de clase mundial
              </p>
            </div>
            <div className={styles.footerLinks}>
              <Link to="/catalog" className={styles.footerLink}>Catálogo</Link>
              <Link to="/login" className={styles.footerLink}>Acceder</Link>
              <Link to="/register" className={styles.footerLink}>Registrarse</Link>
            </div>
          </div>
          <hr className="divider" style={{ margin: '24px 0 16px' }} />
          <p className="body-sm" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
            © {new Date().getFullYear()} Darkitchen. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </main>
  )
}
