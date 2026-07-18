import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserPayload, AuthResponse, LoginDto, RegisterDto } from '@darkitchen/shared'
import * as authApi from '@/api/auth.api'

interface AuthState {
  token: string | null
  user: UserPayload | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  login: (dto: LoginDto) => Promise<void>
  register: (dto: RegisterDto) => Promise<void>
  logout: () => void
  setAuth: (data: AuthResponse) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (dto) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login(dto)
          set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          set({ error: err.message || 'Error al iniciar sesión', isLoading: false })
          throw err
        }
      },

      register: async (dto) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.register(dto)
          set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false })
        } catch (err: any) {
          set({ error: err.message || 'Error al registrarse', isLoading: false })
          throw err
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, error: null })
      },

      setAuth: (data) => {
        set({ token: data.token, user: data.user, isAuthenticated: true })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'darkitchen-auth',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
