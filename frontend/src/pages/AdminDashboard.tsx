import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { useAuthStore } from '@/store/authStore'
import { getAllOrders, updateOrderStatus } from '@/api/orders.api'
import { getProducts } from '@/api/catalog.api'
import { getAllUsers } from '@/api/auth.api'
import type { Order } from '@darkitchen/shared'
import { OrderStatus } from '@darkitchen/shared'
import styles from './AdminDashboard.module.css'

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
}

const STATUS_CLASSES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'status-pending',
  [OrderStatus.CONFIRMED]: 'status-confirmed',
  [OrderStatus.PREPARING]: 'status-preparing',
  [OrderStatus.READY]: 'status-ready',
  [OrderStatus.DELIVERED]: 'status-delivered',
  [OrderStatus.CANCELLED]: 'status-cancelled',
}

export function AdminDashboard() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [kpis, setKpis] = useState([
    { label: 'Total Pedidos', value: '...', icon: 'receipt_long', color: 'amber', delta: '+12%' },
    { label: 'Pedidos Pendientes', value: '...', icon: 'pending_actions', color: 'blue', delta: '-3%' },
    { label: 'Productos en Catálogo', value: '12', icon: 'restaurant_menu', color: 'green', delta: 'Activos' },
    { label: 'Clientes Activos', value: '8', icon: 'people', color: 'purple', delta: 'Registrados' },
  ])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      // Usar Promise.allSettled para no fallar el dashboard si un endpoint falla
      const [ordersRes, productsRes, usersRes] = await Promise.allSettled([
        getAllOrders(),
        getProducts({ limit: 100 }),
        getAllUsers(),
      ])

      const data = ordersRes.status === 'fulfilled' ? ordersRes.value : []
      setOrders(data)
      
      const pendingCount = data.filter(o => o.status === OrderStatus.PENDING).length
      const productsCount = productsRes.status === 'fulfilled' ? productsRes.value.total || productsRes.value.data?.length || 0 : 0
      const usersCount = usersRes.status === 'fulfilled' ? usersRes.value.length : 0
      
      setKpis(prev => [
        { ...prev[0], value: data.length.toString(), delta: '+2% este mes' },
        { ...prev[1], value: pendingCount.toString(), delta: 'Hoy' },
        { ...prev[2], value: productsCount.toString(), delta: 'Activos' },
        { ...prev[3], value: usersCount.toString(), delta: 'Registrados' },
      ])
    } catch (err) {
      console.error(err)
    }
  }

  const cycleStatus = async (orderId: number, currentStatus: OrderStatus) => {
    const cycle = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.DELIVERED]
    const idx = cycle.indexOf(currentStatus)
    if (idx === -1 || idx === cycle.length - 1) return
    const nextStatus = cycle[idx + 1]
    
    try {
      await updateOrderStatus(orderId, nextStatus)
      await fetchOrders()
    } catch (err) {
      console.error(err)
    }
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Tomar solo los últimos 6 pedidos para el dashboard
  const recentOrders = orders.slice(0, 6)

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
          {kpis.map(kpi => (
            <div key={kpi.label} className={`glass-card glow-hover ${styles.kpiCard}`}>
              <div className={`${styles.kpiIcon} ${styles[`kpiIcon_${kpi.color}`]}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <div className={styles.kpiBody}>
                <p className={`body-sm ${styles.kpiLabel}`}>{kpi.label}</p>
                <p className={`headline-lg ${styles.kpiValue}`}>{kpi.value}</p>
                <span className={`${styles.kpiDelta} ${kpi.delta.startsWith('+') ? styles.deltaUp : kpi.delta.startsWith('-') ? styles.deltaDown : ''}`}>
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Recent Orders */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={`headline-sm ${styles.sectionTitle}`}>Pedidos Recientes</h2>
            <Link to="/admin/orders" className={`btn btn-secondary btn-sm`}>Ver todos</Link>
          </div>

          <div className={`glass-card ${styles.tableCard}`}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario ID</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.idCell}>#{order.id}</td>
                      <td className={styles.customerCell}>
                        <div className={styles.customerAvatar}>
                          {order.userId.toString().charAt(0)}
                        </div>
                        Usuario #{order.userId}
                      </td>
                      <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</td>
                      <td className={styles.totalCell}>${order.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${STATUS_CLASSES[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{new Date(order.createdAt).toLocaleTimeString()}</td>
                      <td>
                        {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                          <button
                            className={`btn btn-sm btn-secondary ${styles.advanceBtn}`}
                            onClick={() => cycleStatus(order.id, order.status)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                            Avanzar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>No hay pedidos registrados.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
