import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '@darkitchen/shared'
import { OrderStatus } from '@darkitchen/shared'
import { getMyOrders, createOrder } from '@/api/orders.api'
import { useCartStore } from '@/store/cartStore'
import styles from './OrdersPage.module.css'

// ─── Helpers ───
const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: OrderStatus.PENDING,    label: 'Pendiente',  icon: 'schedule'       },
  { key: OrderStatus.CONFIRMED,  label: 'Confirmado', icon: 'thumb_up'       },
  { key: OrderStatus.PREPARING,  label: 'Preparando', icon: 'restaurant'     },
  { key: OrderStatus.READY,      label: 'Listo',      icon: 'check_circle'   },
  { key: OrderStatus.DELIVERED,  label: 'Entregado',  icon: 'local_shipping' },
]

const STATUS_BADGE_MAP: Record<string, string> = {
  [OrderStatus.PENDING]:   'badge badge-muted',
  [OrderStatus.CONFIRMED]: 'badge badge-blue',
  [OrderStatus.PREPARING]: 'badge badge-amber',
  [OrderStatus.READY]:     'badge badge-green',
  [OrderStatus.DELIVERED]: 'badge badge-green',
  [OrderStatus.CANCELLED]: 'badge badge-red',
}

const STATUS_LABEL_MAP: Record<string, string> = {
  [OrderStatus.PENDING]:   'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.READY]:     'Listo para retirar',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Order Timeline ───
function OrderTimeline({ status }: { status: OrderStatus }) {
  const stepKeys = STATUS_STEPS.map((s) => s.key)
  const currentIdx = stepKeys.indexOf(status)

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineTrack}>
        {STATUS_STEPS.map((step, i) => {
          const isDone    = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div
              key={step.key}
              className={`${styles.timelineStep} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
            >
              <div className={styles.timelineDot}>
                {(isDone || isCurrent) && (
                  <span className={styles.timelineDotIcon}>{step.icon}</span>
                )}
              </div>
              <span className={styles.timelineLabel}>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Order History Card ───
function OrderCard({ order }: { order: Order }) {
  const isActive =
    order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY

  return (
    <article className={`${styles.orderCard} animate-fade-in`}>
      <div className={styles.orderHeader}>
        <div className={styles.orderMeta}>
          <p className={styles.orderNumber}>Pedido #{order.id}</p>
          <p className={styles.orderDate}>{formatDate(order.createdAt)}</p>
        </div>
        <div className={styles.orderStatus}>
          <span
            className={`${STATUS_BADGE_MAP[order.status] ?? 'badge badge-muted'} ${isActive ? 'animate-breathe' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {isActive && <span className="live-dot" style={{ width: 8, height: 8 }} />}
            {STATUS_LABEL_MAP[order.status] ?? order.status}
          </span>
          {order.notes && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Nota: {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {order.status !== OrderStatus.CANCELLED && (
        <OrderTimeline status={order.status} />
      )}

      {/* Items */}
      <div className={styles.orderItemsList}>
        {order.items.map((item) => (
          <div key={item.id} className={styles.orderItem}>
            <span className={styles.orderItemName}>{item.productName}</span>
            <span className={styles.orderItemQty}>x{item.quantity}</span>
            <span className={styles.orderItemPrice}>${item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className={styles.orderFooter}>
        <span className={styles.orderTotalLabel}>Total</span>
        <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
      </div>
    </article>
  )
}

// ─── Cart Section ───
function CartSection({
  onOrderCreated,
}: {
  onOrderCreated: (order: Order) => void
}) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCartStore()
  const [notes, setNotes] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  const subtotal = total
  const tax      = +(subtotal * 0.1).toFixed(2)
  const grandTotal = +(subtotal + tax).toFixed(2)

  const handleConfirm = async () => {
    if (items.length === 0) return
    setIsConfirming(true)
    try {
      const dto = {
        total: grandTotal,
        notes,
        items: items.map((i) => ({
          productId:   i.productId,
          productName: i.productName,
          quantity:    i.quantity,
          price:       i.price,
        })),
      }
      const newOrder = await createOrder(dto)
      clearCart()
      onOrderCreated(newOrder)
    } catch {
      // manejo silencioso
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <section className={styles.cartSection} aria-label="Carrito actual">
      <div className={styles.cartSectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className="material-symbols-outlined">shopping_cart</span>
          Mi Pedido Actual
        </h2>
      </div>

      <div className={styles.cartItemsList}>
        {items.map((item) => (
          <div key={item.productId} className={styles.cartItem}>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.productName}
                className={styles.cartItemImg}
                loading="lazy"
              />
            )}
            <div className={styles.cartItemInfo}>
              <p className={styles.cartItemName}>{item.productName}</p>
              <p className={styles.cartItemMeta}>${item.price.toFixed(2)} c/u</p>
            </div>
            <div className={styles.cartItemControls}>
              <button
                className={styles.qtyBtn}
                id={`orders-qty-minus-${item.productId}`}
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                aria-label="Reducir cantidad"
              >
                −
              </button>
              <span className={styles.qtyNum}>{item.quantity}</span>
              <button
                className={styles.qtyBtn}
                id={`orders-qty-plus-${item.productId}`}
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
            <span className={styles.cartItemPrice}>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
            <button
              className={styles.removeBtn}
              id={`orders-remove-${item.productId}`}
              onClick={() => removeItem(item.productId)}
              aria-label={`Eliminar ${item.productName}`}
            >
              delete
            </button>
          </div>
        ))}
      </div>

      {/* Notas */}
      <div className={styles.notesArea}>
        <label className={styles.notesLabel} htmlFor="orders-notes">
          Notas especiales (opcional)
        </label>
        <textarea
          id="orders-notes"
          className={styles.notesTextarea}
          placeholder="Sin cebolla, alergia a mariscos, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Resumen */}
      <div className={styles.cartSummary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Subtotal</span>
          <span className={styles.summaryValue}>${subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Impuesto (10%)</span>
          <span className={styles.summaryValue}>${tax.toFixed(2)}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalAmount}>${grandTotal.toFixed(2)}</span>
        </div>
        <button
          id="orders-confirm-btn"
          className={`btn btn-primary btn-lg ${styles.confirmBtn}`}
          onClick={handleConfirm}
          disabled={items.length === 0 || isConfirming}
        >
          {isConfirming ? (
            <>
              <div className={styles.spinner} />
              Confirmando pedido...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">receipt_long</span>
              Confirmar Pedido
            </>
          )}
        </button>
      </div>
    </section>
  )
}

// ─── OrdersPage principal ───
export function OrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [lastCreated, setLastCreated] = useState<Order | null>(null)

  const cartItems = useCartStore((s) => s.items)
  const hasCart   = cartItems.length > 0

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleOrderCreated = (order: Order) => {
    setLastCreated(order)
    setOrders((prev) => [order, ...prev])
    // quitar banner tras 6 segundos
    setTimeout(() => setLastCreated(null), 6000)
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleGroup}>
            <div className={styles.titleIcon} aria-hidden>🧾</div>
            <div>
              <h1 className={styles.pageTitle}>Mis Pedidos</h1>
              <p className={styles.pageSubtitle}>Gestiona y sigue el estado de tus pedidos</p>
            </div>
          </div>
          <Link
            to="/catalog"
            id="orders-go-catalog"
            className="btn btn-secondary btn-pill"
          >
            <span className="material-symbols-outlined">menu_book</span>
            Ver catálogo
          </Link>
        </div>
      </header>

      {/* Contenido */}
      <div className={styles.content}>
        {/* Banner de éxito */}
        {lastCreated && (
          <div className={styles.successBanner} role="alert">
            <span className={styles.successIcon}>🎉</span>
            <div className={styles.successText}>
              <p className={styles.successTitle}>¡Pedido #{lastCreated.id} confirmado!</p>
              <p className={styles.successSubtitle}>
                Tu pedido está siendo procesado. Recibirás actualizaciones pronto.
              </p>
            </div>
          </div>
        )}

        {/* Sección carrito */}
        {hasCart && (
          <CartSection onOrderCreated={handleOrderCreated} />
        )}

        {/* Historial de pedidos */}
        {isLoading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingSpinner} />
            <p className="body-sm" style={{ color: 'var(--color-text-muted)' }}>
              Cargando pedidos...
            </p>
          </div>
        ) : orders.length === 0 && !hasCart ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h2 className={styles.emptyTitle}>Sin pedidos todavía</h2>
            <p className={styles.emptyText}>
              Aún no has realizado ningún pedido. Explora nuestro catálogo y realiza tu primer pedido.
            </p>
            <Link
              to="/catalog"
              id="orders-empty-go-catalog"
              className="btn btn-primary btn-lg btn-pill"
            >
              <span className="material-symbols-outlined">menu_book</span>
              Explorar catálogo
            </Link>
          </div>
        ) : orders.length > 0 ? (
          <section className={styles.ordersSection} aria-label="Historial de pedidos">
            <h2 className={styles.sectionTitle}>
              <span className="material-symbols-outlined">history</span>
              Historial de Pedidos
            </h2>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
