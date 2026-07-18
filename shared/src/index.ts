// ────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────

export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ────────────────────────────────────────────
// USER TYPES
// ────────────────────────────────────────────

export interface UserPayload {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: UserPayload;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ────────────────────────────────────────────
// PRODUCT TYPES
// ────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
}

// ────────────────────────────────────────────
// ORDER TYPES
// ────────────────────────────────────────────

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemDto {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  total: number;
  notes?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

// ────────────────────────────────────────────
// CART TYPES (Frontend-only, no persisted in DB)
// ────────────────────────────────────────────

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// ────────────────────────────────────────────
// MESSAGE / CHAT TYPES
// ────────────────────────────────────────────

export interface Message {
  id: number;
  content: string;
  userId: number;
  userName?: string;
  room: string;
  createdAt: string;
}

export interface SendMessageDto {
  content: string;
  room: string;
}

export interface ChatRoom {
  room: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}
