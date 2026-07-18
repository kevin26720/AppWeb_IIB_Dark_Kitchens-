import type { Product, ProductsResponse } from '@darkitchen/shared'

const CATEGORIES = ['Entradas', 'Platos Fuertes', 'Ensaladas', 'Bebidas', 'Postres']

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Menú Ejecutivo de Asado',
    description: 'Selección premium de carnes a la parrilla con guarniciones gourmet. Incluye chimichurri artesanal y pan de campo.',
    price: 28.50,
    category: 'Platos Fuertes',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Ensalada César Premium',
    description: 'Lechuga romana fresca, crutones artesanales, parmesano reggiano y aderezo César de la casa.',
    price: 12.00,
    category: 'Ensaladas',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Jugo Natural de Maracuyá',
    description: 'Jugo fresco de maracuyá con toque de menta y azúcar de caña. Sin conservantes.',
    price: 5.50,
    category: 'Bebidas',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Paella Valenciana',
    description: 'Arroz bomba con azafrán, mariscos frescos, pollo de corral y verduras de temporada.',
    price: 32.00,
    category: 'Platos Fuertes',
    imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Pollo a la Mostaza',
    description: 'Pechuga de pollo al horno con salsa de mostaza Dijon, hierbas provenzales y puré de papa trufa.',
    price: 22.00,
    category: 'Platos Fuertes',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Crostini de Salmón',
    description: 'Pan tostado con salmón ahumado, queso crema, alcaparras y eneldo fresco.',
    price: 14.50,
    category: 'Entradas',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Tiramisú Clásico',
    description: 'Postre italiano tradicional con mascarpone, espresso, ladyfingers y cacao en polvo.',
    price: 9.00,
    category: 'Postres',
    imageUrl: 'https://images.unsplash.com/photo-1586899028174-e7098604235b?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Carpaccio de Res',
    description: 'Láminas finas de res con rúgula, alcaparras, parmesano y aceite de oliva extra virgen.',
    price: 18.00,
    category: 'Entradas',
    imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const mockGetProducts = async (params?: {
  limit?: number
  offset?: number
  category?: string
  q?: string
}): Promise<ProductsResponse> => {
  await delay(400)
  let products = [...MOCK_PRODUCTS]

  if (params?.category) {
    products = products.filter((p) => p.category === params.category)
  }
  if (params?.q) {
    const q = params.q.toLowerCase()
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    )
  }

  const limit = params?.limit ?? 10
  const offset = params?.offset ?? 0
  const paginated = products.slice(offset, offset + limit)

  return { data: paginated, total: products.length, limit, offset }
}

export const mockGetProduct = async (id: number): Promise<Product> => {
  await delay(200)
  const product = MOCK_PRODUCTS.find((p) => p.id === id)
  if (!product) throw new Error('Producto no encontrado')
  return product
}

export const mockGetCategories = async (): Promise<string[]> => {
  await delay(200)
  return CATEGORIES
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
