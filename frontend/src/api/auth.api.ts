import type { AuthResponse, LoginDto, RegisterDto, UserPayload } from '@darkitchen/shared'
import { mockLogin, mockRegister, mockForgotPassword } from './mock/auth.mock'
import { client } from './client'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  if (MOCK) return mockLogin(dto)
  const { data } = await client.post<AuthResponse>('/auth/login', dto)
  return data
}

export const changePassword = async (dto: any): Promise<{ message: string }> => {
  const { data } = await client.post<{ message: string }>('/auth/change-password', dto)
  return data
}

export const getAllUsers = async (): Promise<UserPayload[]> => {
  const { data } = await client.get<UserPayload[]>('/auth/users')
  return data
}

export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  if (MOCK) return mockRegister(dto)
  const { data } = await client.post<AuthResponse>('/auth/register', dto)
  return data
}

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  if (MOCK) return { message: 'MOCK: Email verified' }
  const { data } = await client.post<{ message: string }>('/auth/verify-email', { token })
  return data
}

export const forgotPassword = async (email: string): Promise<void> => {
  if (MOCK) return mockForgotPassword(email)
  await client.post('/auth/forgot-password', { email })
}

export const resetPassword = async (token: string, newPassword: string): Promise<{ message: string }> => {
  const { data } = await client.post<{ message: string }>('/auth/reset-password', { token, newPassword })
  return data
}

export const getProfile = async () => {
  const { data } = await client.get('/auth/profile')
  return data
}
