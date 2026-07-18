import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getProducts, getCategories } from '@/api/catalog.api'
import type { Product } from '@darkitchen/shared'
import styles from './AdminProducts.module.css'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 100 }),
      getCategories()
    ]).then(([resProducts, resCategories]) => {
      setProducts(resProducts.data)
      setCategories(resCategories)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1 className="headline-lg" style={{ color: 'var(--color-text-primary)' }}>Gestión de Productos</h1>
            <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>Administra el catálogo y la disponibilidad</p>
          </div>
          <button className="btn btn-primary" id="btn-new-product">
            <span className="material-symbols-outlined">add</span>
            Nuevo Producto
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
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th align="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.productImageWrapper}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                          ) : (
                            <div className={styles.productImagePlaceholder}>
                              <span className="material-symbols-outlined">restaurant</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="headline-sm" style={{ color: 'var(--color-text-primary)' }}>{product.name}</p>
                          <p className="body-sm" style={{ color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-amber">{product.category}</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>${product.price.toFixed(2)}</span>
                    </td>
                    <td>
                      {product.available ? (
                        <span className="badge badge-green">Disponible</span>
                      ) : (
                        <span className="badge badge-muted">Agotado</span>
                      )}
                    </td>
                    <td align="right">
                      <div className={styles.actionButtons}>
                        <button className="btn btn-icon btn-ghost" title="Editar" id={`btn-edit-${product.id}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                        </button>
                        <button className="btn btn-icon btn-ghost" style={{ color: 'var(--color-error)' }} title="Eliminar" id={`btn-delete-${product.id}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
