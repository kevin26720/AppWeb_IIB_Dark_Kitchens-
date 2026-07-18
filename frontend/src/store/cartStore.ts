import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@darkitchen/shared'

interface CartState {
  items: CartItem[]
  isOpen: boolean

  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  total: number
  itemCount: number
}

const calculateTotals = (items: CartItem[]) => {
  return {
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      total: 0,
      itemCount: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          let newItems: CartItem[]
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            newItems = state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          } else {
            newItems = [
              ...state.items,
              {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity,
                imageUrl: product.imageUrl,
              },
            ]
          }
          return {
            items: newItems,
            ...calculateTotals(newItems)
          }
        })
      },

      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId)
          return { items: newItems, ...calculateTotals(newItems) }
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => {
          const newItems = state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          )
          return { items: newItems, ...calculateTotals(newItems) }
        })
      },

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'darkitchen-cart',
      partialize: (state) => ({ 
        items: state.items,
        total: state.total,
        itemCount: state.itemCount 
      }),
    }
  )
)
