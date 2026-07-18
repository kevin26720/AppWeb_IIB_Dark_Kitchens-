import type { AuthResponse, LoginDto, RegisterDto } from '@darkitchen/shared'
import { mockLogin, mockRegister, mockForgotPassword } from './mock/auth.mock'
import { client } from './client'

const MOCK = import.meta.env.VITE_MOCK_MODE === 'true'

export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  if (MOCK) return mockLogin(dto)
  const { data } = await client.post<AuthResponse>('/api/auth/login', dto)
  return data
}

export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  if (MOCK) return mockRegister(dto)
  const { data } = await client.post<AuthResponse>('/api/auth/register', dto)
  return data
}

export const forgotPassword = async (email: string): Promise<void> => {
  if (MOCK) return mockForgotPassword(email)
  await client.post('/api/auth/forgot-password', { email })
}

export const getProfile = async () => {
  const { data } = await client.get('/api/auth/profile')
  return data
}
