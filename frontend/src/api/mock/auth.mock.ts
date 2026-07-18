import type { AuthResponse, LoginDto, RegisterDto } from '@darkitchen/shared'
import { Role } from '@darkitchen/shared'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

const MOCK_USERS = [
  { id: 1, email: 'admin@catering.com', password: 'Admin123!', name: 'Admin Darkitchen', role: Role.ADMIN },
  { id: 2, email: 'cliente@example.com', password: 'Client123!', name: 'Cliente Demo', role: Role.CLIENT },
]

const makeToken = (user: { id: number; role: Role }) =>
  `mock.jwt.${btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 900000 }))}`

export const mockLogin = async (dto: LoginDto): Promise<AuthResponse> => {
  await delay(600)
  const user = MOCK_USERS.find(
    (u) => u.email === dto.email && u.password === dto.password
  )
  if (!user) throw new Error('Credenciales incorrectas')
  const { password: _, ...safeUser } = user
  return { token: makeToken(user), user: safeUser }
}

export const mockRegister = async (dto: RegisterDto): Promise<AuthResponse> => {
  await delay(800)
  if (MOCK_USERS.find((u) => u.email === dto.email)) {
    throw new Error('El correo ya está registrado')
  }
  const newUser = { id: 99, email: dto.email, name: dto.name, role: Role.CLIENT }
  return { token: makeToken({ id: 99, role: Role.CLIENT }), user: newUser }
}

export const mockForgotPassword = async (email: string): Promise<void> => {
  await delay(500)
  console.info(`[MOCK] Reset token para ${email}: mock-reset-token-12345`)
}
