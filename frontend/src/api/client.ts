import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/api\/?$/, '').replace(/\/$/, '') + '/api',
  timeout: 15000,
})

// Request interceptor — inyectar JWT
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — manejar 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(
      new Error(err.response?.data?.message || err.message || 'Error del servidor')
    )
  }
)
