import type { Order, CreateOrderDto } from '@darkitchen/shared'
import { OrderStatus } from '@darkitchen/shared'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

let ORDER_COUNTER = 10

export const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    userId: 2,
    status: OrderStatus.DELIVERED,
    total: 56.00,
    notes: 'Sin cebolla en el asado',
    items: [
      { id: 1, productId: 1, productName: 'Menú Ejecutivo de Asado', quantity: 1, price: 28.50, subtotal: 28.50 },
      { id: 2, productId: 2, productName: 'Ensalada César Premium', quantity: 2, price: 12.00, subtotal: 24.00 },
      { id: 3, productId: 3, productName: 'Jugo Natural de Maracuyá', quantity: 1, price: 5.50, subtotal: 5.50 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    userId: 2,
    status: OrderStatus.PREPARING,
    total: 32.00,
    notes: '',
    items: [
      { id: 4, productId: 4, productName: 'Paella Valenciana', quantity: 1, price: 32.00, subtotal: 32.00 },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

export const mockGetMyOrders = async (): Promise<Order[]> => {
  await delay(500)
  return MOCK_ORDERS
}

export const mockCreateOrder = async (dto: CreateOrderDto): Promise<Order> => {
  await delay(800)
  const newOrder: Order = {
    id: ++ORDER_COUNTER,
    userId: 2,
    status: OrderStatus.PENDING,
    total: dto.total,
    notes: dto.notes,
    items: dto.items.map((item, idx) => ({
      id: idx + 100,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  MOCK_ORDERS.push(newOrder)
  return newOrder
}

export const mockGetAllOrders = async (): Promise<Order[]> => {
  await delay(400)
  return MOCK_ORDERS
}

export const mockUpdateOrderStatus = async (
  orderId: number,
  status: OrderStatus
): Promise<Order> => {
  await delay(400)
  const order = MOCK_ORDERS.find((o) => o.id === orderId)
  if (!order) throw new Error('Orden no encontrada')
  order.status = status
  order.updatedAt = new Date().toISOString()
  return { ...order }
}
