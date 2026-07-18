import type { Product, ProductsResponse } from '@darkitchen/shared'
import { mockGetProducts, mockGetProduct, mockGetCategories } from './mock/catalog.mock'
import { client } from './client'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

export const getProducts = async (params?: {
  limit?: number; offset?: number; category?: string; q?: string
}): Promise<ProductsResponse> => {
  if (MOCK) return mockGetProducts(params)
  const { data } = await client.get<ProductsResponse>('/api/products', { params })
  return data
}

export const getProduct = async (id: number): Promise<Product> => {
  if (MOCK) return mockGetProduct(id)
  const { data } = await client.get<Product>(`/api/products/${id}`)
  return data
}

export const getCategories = async (): Promise<string[]> => {
  if (MOCK) return mockGetCategories()
  const { data } = await client.get<string[]>('/api/products/categories/list')
  return data
}

export const createProduct = async (dto: Partial<Product>) => {
  const { data } = await client.post('/api/products', dto)
  return data
}

export const updateProduct = async (id: number, dto: Partial<Product>) => {
  const { data } = await client.put(`/api/products/${id}`, dto)
  return data
}

export const deleteProduct = async (id: number) => {
  await client.delete(`/api/products/${id}`)
}
