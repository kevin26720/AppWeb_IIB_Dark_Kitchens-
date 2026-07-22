import type { Order, CreateOrderDto } from '@darkitchen/shared'
import { OrderStatus } from '@darkitchen/shared'
import { mockGetMyOrders, mockCreateOrder, mockGetAllOrders, mockUpdateOrderStatus } from './mock/orders.mock'
import { client } from './client'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

export const getMyOrders = async (): Promise<Order[]> => {
  if (MOCK) return mockGetMyOrders()
  const { data } = await client.get<Order[]>('/orders/my-orders')
  return data
}

export const createOrder = async (dto: CreateOrderDto): Promise<Order> => {
  if (MOCK) return mockCreateOrder(dto)
  const { data } = await client.post<Order>('/orders', dto)
  return data
}

export const getAllOrders = async (): Promise<Order[]> => {
  if (MOCK) return mockGetAllOrders()
  const { data } = await client.get<Order[]>('/orders')
  return data
}

export const updateOrderStatus = async (id: number, status: OrderStatus): Promise<Order> => {
  if (MOCK) return mockUpdateOrderStatus(id, status)
  const { data } = await client.put<Order>(`/orders/${id}/status`, { status })
  return data
}
