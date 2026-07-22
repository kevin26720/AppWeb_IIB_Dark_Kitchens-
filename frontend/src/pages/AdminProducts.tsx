import { useEffect, useState, FormEvent } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '@/api/catalog.api'
import type { Product } from '@darkitchen/shared'
import styles from './AdminProducts.module.css'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    available: true
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      getProducts({ limit: 100 }),
      getCategories()
    ]).then(([resProducts, resCategories]) => {
      setProducts(resProducts.data)
      setCategories(resCategories)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setSelectedProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || '',
        available: product.available
      })
    } else {
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: categories.length > 0 ? categories[0] : '',
        imageUrl: '',
        available: true
      })
    }
    setIsFormModalOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormModalOpen(false)
    setSelectedProduct(null)
  }

  const handleOpenDelete = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false)
    setSelectedProduct(null)
  }

  // Toast state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Cleanup empty strings for optional URL validation
    const payload: any = { ...formData }
    if (!payload.imageUrl || payload.imageUrl.trim() === '') {
      payload.imageUrl = undefined
    }

    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, payload)
        showToast('Producto actualizado correctamente', 'success')
      } else {
        await createProduct(payload)
        showToast('Producto creado correctamente', 'success')
      }
      handleCloseForm()
      loadData()
    } catch (err: any) {
      console.error('Error saving product', err)
      const errorMsg = err.message || 'Hubo un error al guardar el producto'
      showToast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return
    setSubmitting(true)
    try {
      await deleteProduct(selectedProduct.id)
      showToast('Producto eliminado', 'info')
      handleCloseDelete()
      loadData()
    } catch (err: any) {
      console.error('Error deleting product', err)
      const errorMsg = err.message || 'Hubo un error al eliminar el producto'
      showToast(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1 className="headline-lg" style={{ color: 'var(--color-text-primary)' }}>Gestión de Productos</h1>
            <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>Administra el catálogo y la disponibilidad</p>
          </div>
          <button className="btn btn-primary" id="btn-new-product" onClick={() => handleOpenForm()}>
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
                        <button className="btn btn-icon btn-ghost" title="Editar" id={`btn-edit-${product.id}`} onClick={() => handleOpenForm(product)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                        </button>
                        <button className="btn btn-icon btn-ghost" style={{ color: 'var(--color-error)' }} title="Eliminar" id={`btn-delete-${product.id}`} onClick={() => handleOpenDelete(product)}>
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

      {/* MODAL DE FORMULARIO DE PRODUCTO */}
      {isFormModalOpen && (
        <>
          <div className="overlay" onClick={handleCloseForm} />
          <div className="modal">
            <h2 className="headline-md" style={{ marginBottom: 20 }}>
              {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Nombre</label>
                <input 
                  type="text" 
                  required 
                  className="input-field" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Descripción</label>
                <textarea 
                  required 
                  className="input-field" 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Precio ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="input-field" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Categoría</label>
                  <select 
                    className="input-field"
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="" disabled>Selecciona...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    {/* Allow new categories indirectly or just rely on existing if required */}
                    {!categories.includes(formData.category) && formData.category && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">URL de Imagen (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.imageUrl} 
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input 
                  type="checkbox" 
                  id="chk-available" 
                  checked={formData.available}
                  onChange={e => setFormData({ ...formData, available: e.target.checked })}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="chk-available" style={{ cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Producto disponible para la venta
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseForm} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      {isDeleteModalOpen && selectedProduct && (
        <>
          <div className="overlay" onClick={handleCloseDelete} />
          <div className="modal">
            <h2 className="headline-md" style={{ marginBottom: 16 }}>Confirmar Eliminación</h2>
            <p className="body-md">
              ¿Estás seguro que deseas eliminar el producto <strong>{selectedProduct.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseDelete} disabled={submitting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm} disabled={submitting}>
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' && <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>check_circle</span>}
          {toast.type === 'error' && <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>error</span>}
          {toast.type === 'info' && <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>info</span>}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
