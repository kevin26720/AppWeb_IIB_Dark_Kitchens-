import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import styles from './CartDrawer.module.css'

export function CartDrawer() {
  const navigate = useNavigate()
  const { items, total, updateQuantity, removeItem, isOpen, closeCart } = useCartStore()

  if (!isOpen) return null

  const handleConfirm = () => {
    closeCart()
    navigate('/orders')
  }

  return (
    <>
      <div
        className={styles.drawerOverlay}
        onClick={closeCart}
        id="cart-drawer-overlay"
        role="presentation"
      />
      <aside className={styles.cartDrawer} aria-label="Mi pedido">
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            <span className="material-symbols-outlined">shopping_bag</span>
            Mi Pedido
          </h2>
          <button
            className={styles.drawerClose}
            onClick={closeCart}
            id="cart-drawer-close"
            aria-label="Cerrar carrito"
          >
            close
          </button>
        </div>

        {/* Items */}
        <div className={styles.cartItems}>
          {items.length === 0 ? (
            <div className={styles.cartEmptyState}>
              <div className={styles.cartEmptyIcon}>🛒</div>
              <p className="body-md">Tu pedido está vacío</p>
              <p className="body-sm" style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                Agrega productos del catálogo
              </p>
            </div>
          ) : (
            items.map((item) => (
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
                  <p className={styles.cartItemPrice}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className={styles.cartItemControls}>
                  <button
                    className={styles.qtyBtn}
                    id={`cart-qty-minus-${item.productId}`}
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Reducir cantidad"
                  >
                    −
                  </button>
                  <span className={styles.qtyNum}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    id={`cart-qty-plus-${item.productId}`}
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                  <button
                    className={styles.cartRemove}
                    id={`cart-remove-${item.productId}`}
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Eliminar ${item.productName}`}
                  >
                    delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total estimado</span>
            <span className={styles.totalAmount}>${total.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            id="cart-confirm-order"
            onClick={handleConfirm}
            disabled={items.length === 0}
          >
            <span className="material-symbols-outlined">receipt_long</span>
            Confirmar Pedido
          </button>
        </div>
      </aside>
    </>
  )
}
