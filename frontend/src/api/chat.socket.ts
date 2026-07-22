import { io, Socket } from 'socket.io-client'

// Define la URL del servidor WebSocket basándose en las variables de entorno.
// Si no está definida, utiliza un valor por defecto para desarrollo local.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let socket: Socket | null = null

export const initSocket = (token: string) => {
  if (socket) return socket

  socket = io(API_URL, {
    path: '/socket.io',
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
