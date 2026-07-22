import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getAllOrders, updateOrderStatus } from '@/api/orders.api'
import type { Order } from '@darkitchen/shared'
import { OrderStatus } from '@darkitchen/shared'
import styles from './AdminOrders.module.css'

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await getAllOrders()
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setUpdating(orderId)
    try {
      await updateOrderStatus(orderId, newStatus)
      await fetchOrders()
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadgeClass = (status: OrderStatus) => {
    const map = {
      [OrderStatus.PENDING]: 'status-pending',
      [OrderStatus.CONFIRMED]: 'status-confirmed',
      [OrderStatus.PREPARING]: 'status-preparing',
      [OrderStatus.READY]: 'status-ready',
      [OrderStatus.DELIVERED]: 'status-delivered',
      [OrderStatus.CANCELLED]: 'status-cancelled'
    }
    return map[status] || 'badge-muted'
  }

  const getStatusLabel = (status: OrderStatus) => {
    const map = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Listo',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado'
    }
    return map[status] || status
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1 className="headline-lg" style={{ color: 'var(--color-text-primary)' }}>Gestión de Pedidos</h1>
            <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>Supervisa y actualiza el estado de las órdenes</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchOrders}>
            <span className="material-symbols-outlined">refresh</span>
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        ) : (
          <div className={`glass-card ${styles.tableContainer}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="label-md" style={{ color: 'var(--color-on-surface-variant)' }}>#{order.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td>
                      <p className="body-md" style={{ color: 'var(--color-text-primary)' }}>Usuario ID: {order.userId}</p>
                      {order.notes && <p className="body-sm" style={{ color: 'var(--color-primary)', fontSize: 12 }}>Nota: {order.notes}</p>}
                    </td>
                    <td>
                      <p className="body-sm" style={{ color: 'var(--color-on-surface)' }}>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</p>
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</span>
                    </td>
                    <td>
                      <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'numeric', year: 'numeric' })}</p>
                      <p className="body-sm" style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      <select 
                        className={styles.statusSelect}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        disabled={updating === order.id}
                      >
                        {Object.values(OrderStatus).map(status => (
                          <option key={status} value={status}>{getStatusLabel(status)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>No hay pedidos registrados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
