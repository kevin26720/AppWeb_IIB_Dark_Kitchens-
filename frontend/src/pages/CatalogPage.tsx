import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '@darkitchen/shared'
import { getProducts, getCategories } from '@/api/catalog.api'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@darkitchen/shared'
import styles from './CatalogPage.module.css'

const CATEGORIES = ['Todos', 'Entradas', 'Platos Fuertes', 'Ensaladas', 'Bebidas', 'Postres']
const PAGE_SIZE = 6

// ─── Skeleton card ───
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.medium}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
        <div className={`${styles.skeletonLine} ${styles.medium}`} />
      </div>
    </div>
  )
}

// ─── Product Card ───
interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useAuthStore()
  const isAdmin = user?.role === Role.ADMIN
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article
      className={`${styles.productCard} ${!product.available ? styles.unavailable : ''} animate-fade-in`}
    >
      {/* Imagen */}
      <div className={styles.imgWrapper}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className={styles.productImg}
          loading="lazy"
        />
        <div className={styles.imgOverlay} />
        <span className={`${styles.categoryBadge} badge badge-amber`}>
          {product.category}
        </span>
        {!product.available && (
          <span className={`${styles.unavailableBadge} badge badge-muted`}>
            Agotado
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className={styles.cardBody}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productDesc}>{product.description}</p>

        <div className={styles.cardFooter}>
          <span className={styles.price}>${product.price.toFixed(2)}</span>
          {!isAdmin && (
            <button
              id={`add-to-cart-${product.id}`}
              className={`${styles.addBtn} ${added ? styles.added : ''}`}
              onClick={handleAdd}
              disabled={!product.available}
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {added ? 'check_circle' : 'add_shopping_cart'}
              </span>
              {added ? '¡Añadido!' : 'Agregar'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}


// ─── CatalogPage principal ───
export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})

  const { itemCount, openCart, isOpen } = useCartStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === Role.ADMIN

  // Cargar categorías
  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(['Todos', ...cats]))
      .catch(() => {})
  }, [])

  // Cargar cuentas de categorias (ignora la categoría seleccionada)
  useEffect(() => {
    getProducts({ limit: 1000, q: searchQuery || undefined })
      .then((res) => {
        const filtered = onlyAvailable ? res.data.filter((p) => p.available) : res.data
        const counts: Record<string, number> = { 'Todos': filtered.length }
        filtered.forEach((p) => {
          counts[p.category] = (counts[p.category] || 0) + 1
        })
        setCategoryCounts(counts)
      })
      .catch(() => {})
  }, [searchQuery, onlyAvailable])

  // Cargar productos
  const loadProducts = useCallback(
    async (targetPage: number, reset = false) => {
      setIsLoading(true)
      try {
        const response = await getProducts({
          limit: PAGE_SIZE,
          offset: (targetPage - 1) * PAGE_SIZE,
          category: selectedCategory !== 'Todos' ? selectedCategory : undefined,
          q: searchQuery || undefined,
        })
        const filtered = onlyAvailable
          ? response.data.filter((p) => p.available)
          : response.data

        if (reset) {
          setAllProducts(filtered)
          setProducts(filtered)
        } else {
          // Prevents duplicates if strict mode or rapid clicks fire multiple requests
          setAllProducts((prev) => {
            const map = new Map(prev.map(p => [p.id, p]))
            filtered.forEach(p => map.set(p.id, p))
            return Array.from(map.values())
          })
          setProducts((prev) => {
            const map = new Map(prev.map(p => [p.id, p]))
            filtered.forEach(p => map.set(p.id, p))
            return Array.from(map.values())
          })
        }
        setHasMore(response.total > targetPage * PAGE_SIZE)
      } catch {
        // silencio
      } finally {
        setIsLoading(false)
      }
    },
    [selectedCategory, searchQuery, onlyAvailable]
  )

  // Recargar al cambiar filtros
  useEffect(() => {
    setPage(1)
    loadProducts(1, true)
  }, [selectedCategory, searchQuery, onlyAvailable, loadProducts])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    loadProducts(next, false)
  }

  // Contar por categoría
  const countByCategory = (cat: string) => {
    return categoryCounts[cat] || 0
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div className={styles.titleGroup}>
              <div className={styles.titleIcon} aria-hidden>🍽️</div>
              <div>
                <h1 className={styles.pageTitle}>Nuestro Catálogo</h1>
                <p className={styles.pageSubtitle}>
                  Descubre nuestra selección gourmet
                </p>
              </div>
            </div>
            {!isAdmin && (
              <button
                className={styles.cartHeaderBtn}
                id="catalog-cart-header-btn"
                onClick={openCart}
                aria-label="Abrir carrito"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  shopping_cart
                </span>
                Mi Pedido
                {itemCount > 0 && (
                  <span className={styles.cartBadge}>{itemCount}</span>
                )}
              </button>
            )}
          </div>

          {/* Barra de búsqueda */}
          <div className={styles.searchBar}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
            <input
              id="catalog-search-input"
              type="search"
              placeholder="Buscar platos, ingredientes..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className={styles.contentLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterCard}>
            <p className={styles.filterTitle}>
              <span className="material-symbols-outlined">tune</span>
              Categorías
            </p>
            <ul className={styles.categoryList} role="listbox" aria-label="Filtrar por categoría">
              {categories.map((cat) => (
                <li key={cat} role="option" aria-selected={selectedCategory === cat}>
                  <button
                    id={`filter-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                    <span className={styles.categoryCount}>{countByCategory(cat)}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.divider} />

            <p className={styles.filterTitle} style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined">filter_list</span>
              Disponibilidad
            </p>
            <label
              className={styles.availabilityToggle}
              id="filter-availability-label"
              htmlFor="filter-availability-toggle"
            >
              <span className={styles.toggleLabel}>Solo disponibles</span>
              <div
                id="filter-availability-toggle"
                role="switch"
                aria-checked={onlyAvailable}
                className={`${styles.toggle} ${onlyAvailable ? styles.on : ''}`}
                onClick={() => setOnlyAvailable((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    setOnlyAvailable((v) => !v)
                  }
                }}
                tabIndex={0}
              />
            </label>
          </div>
        </aside>

        {/* Área de productos */}
        <main className={styles.productsArea}>
          <div className={styles.resultsHeader}>
            <p className={styles.resultsCount}>
              <strong>{products.length}</strong>{' '}
              {products.length === 1 ? 'producto' : 'productos'} encontrados
              {selectedCategory !== 'Todos' && (
                <> en <strong>{selectedCategory}</strong></>
              )}
            </p>
          </div>

          {/* Grid de productos */}
          {isLoading && products.length === 0 ? (
            <div className={styles.productGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h2 className={styles.emptyTitle}>Sin resultados</h2>
              <p className={styles.emptyText}>
                No encontramos productos con esos filtros. Intenta otra búsqueda.
              </p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !isLoading && (
            <div className={styles.loadMoreWrapper}>
              <button
                id="catalog-load-more"
                className="btn btn-secondary btn-lg btn-pill"
                onClick={handleLoadMore}
              >
                <span className="material-symbols-outlined">expand_more</span>
                Ver más productos
              </button>
            </div>
          )}

          {isLoading && products.length > 0 && (
            <div className={styles.loadMoreWrapper}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Cargando...
              </span>
            </div>
          )}
        </main>
      </div>

      {/* FAB del carrito */}
      {!isAdmin && itemCount > 0 && !isOpen && (
        <button
          className={styles.cartFab}
          id="catalog-cart-fab"
          onClick={openCart}
          aria-label={`Ver carrito con ${itemCount} productos`}
        >
          <span className="material-symbols-outlined">shopping_cart</span>
          <span className={styles.fabBadge}>{itemCount}</span>
          Ver pedido · ${useCartStore.getState().total.toFixed(2)}
        </button>
      )}
    </div>
  )
}
