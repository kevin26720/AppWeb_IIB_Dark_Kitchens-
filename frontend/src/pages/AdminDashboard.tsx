import { useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { useAuthStore } from '@/store/authStore'
import styles from './AdminDashboard.module.css'

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

interface MockOrder {
  id: number
  customer: string
  status: OrderStatus
  total: number
  items: number
  date: string
}

const MOCK_ORDERS: MockOrder[] = [
  { id: 1001, customer: 'Carlos Mendoza', status: 'PENDING', total: 45.50, items: 3, date: '2026-07-12 20:14' },
  { id: 1002, customer: 'Ana García', status: 'CONFIRMED', total: 28.00, items: 2, date: '2026-07-12 19:55' },
  { id: 1003, customer: 'Luis Torres', status: 'PREPARING', total: 67.20, items: 4, date: '2026-07-12 19:30' },
  { id: 1004, customer: 'María Rodríguez', status: 'READY', total: 33.10, items: 2, date: '2026-07-12 19:10' },
  { id: 1005, customer: 'Pedro Sánchez', status: 'DELIVERED', total: 52.80, items: 5, date: '2026-07-12 18:45' },
  { id: 1006, customer: 'Sofía Jiménez', status: 'CANCELLED', total: 19.00, items: 1, date: '2026-07-12 18:20' },
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

const STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: 'status-pending',
  CONFIRMED: 'status-confirmed',
  PREPARING: 'status-preparing',
  READY: 'status-ready',
  DELIVERED: 'status-delivered',
  CANCELLED: 'status-cancelled',
}

const KPI_CARDS = [
  { label: 'Total Pedidos', value: '248', icon: 'receipt_long', color: 'amber', delta: '+12%' },
  { label: 'Pedidos Pendientes', value: '14', icon: 'pending_actions', color: 'blue', delta: '-3%' },
  { label: 'Productos en Catálogo', value: '56', icon: 'restaurant_menu', color: 'green', delta: '+5%' },
  { label: 'Clientes Activos', value: '1,243', icon: 'people', color: 'purple', delta: '+8%' },
]

export function AdminDashboard() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<MockOrder[]>(MOCK_ORDERS)

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const cycleStatus = (orderId: number) => {
    const cycle: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      const idx = cycle.indexOf(o.status)
      const next = cycle[Math.min(idx + 1, cycle.length - 1)]
      return { ...o, status: next }
    }))
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={`headline-lg ${styles.greeting}`}>
              Hola, {user?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className={`body-sm ${styles.dateStr}`}>{dateStr}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.liveIndicator}>
              <span className="live-dot" />
              <span className="body-sm" style={{ color: 'var(--color-secondary)' }}>En vivo</span>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <section className={styles.kpiGrid}>
          {KPI_CARDS.map(kpi => (
            <div key={kpi.label} className={`glass-card glow-hover ${styles.kpiCard}`}>
              <div className={`${styles.kpiIcon} ${styles[`kpiIcon_${kpi.color}`]}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <div className={styles.kpiBody}>
                <p className={`body-sm ${styles.kpiLabel}`}>{kpi.label}</p>
                <p className={`headline-lg ${styles.kpiValue}`}>{kpi.value}</p>
                <span className={`${styles.kpiDelta} ${kpi.delta.startsWith('+') ? styles.deltaUp : styles.deltaDown}`}>
                  {kpi.delta} este mes
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Orders */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={`headline-sm ${styles.sectionTitle}`}>Pedidos Recientes</h2>
            <a href="/admin/orders" className={`btn btn-secondary btn-sm`}>Ver todos</a>
          </div>

          <div className={`glass-card ${styles.tableCard}`}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.idCell}>#{order.id}</td>
                      <td className={styles.customerCell}>
                        <div className={styles.customerAvatar}>
                          {order.customer.charAt(0)}
                        </div>
                        {order.customer}
                      </td>
                      <td>{order.items} items</td>
                      <td className={styles.totalCell}>${order.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASSES[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{order.date}</td>
                      <td>
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            className={`btn btn-sm btn-secondary ${styles.advanceBtn}`}
                            onClick={() => cycleStatus(order.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                            Avanzar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
