import { create } from 'zustand'
import type { Message, ChatRoom } from '@darkitchen/shared'
import { initSocket, disconnectSocket, getSocket } from '../api/chat.socket'

interface ChatState {
  messages: Message[]
  currentRoom: string | null
  isConnected: boolean
  isTyping: boolean
  typingUser: string | null
  rooms: ChatRoom[]
  unreadCount: number

  connect: (token: string) => void
  disconnect: () => void
  setRoom: (room: string) => void
  sendMessage: (content: string, room: string) => void
  sendTyping: (room: string, isTyping: boolean) => void
  addMessage: (msg: Message) => void
  setMessages: (msgs: Message[]) => void
  setRooms: (rooms: ChatRoom[]) => void
  markAsRead: () => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentRoom: null,
  isConnected: false,
  isTyping: false,
  typingUser: null,
  rooms: [],
  unreadCount: 0,

  connect: (token: string) => {
    const socket = initSocket(token)

    socket.on('connect', () => {
      set({ isConnected: true })
      const room = get().currentRoom
      if (room) {
        socket.emit('chat:join-room', room)
      }
    })

    socket.on('disconnect', () => {
      set({ isConnected: false })
    })

    socket.on('chat:message', (msg: Message) => {
      set((state) => ({
        messages: [...state.messages, msg],
        unreadCount: state.currentRoom !== msg.room ? state.unreadCount + 1 : state.unreadCount,
      }))
    })

    socket.on('chat:typing', (data: { userId: number | string }) => {
      set({ isTyping: true, typingUser: String(data.userId) })
    })

    socket.on('chat:stop-typing', () => {
      set({ isTyping: false, typingUser: null })
    })

    socket.on('order:update', (payload) => {
      // Opcional: mostrar una notificación en el chat o en el sistema general
      console.log('Order update received in chat:', payload)
    })
  },

  disconnect: () => {
    disconnectSocket()
    set({ isConnected: false, messages: [], currentRoom: null, unreadCount: 0 })
  },

  setRoom: (room: string) => {
    const socket = getSocket()
    const current = get().currentRoom

    if (socket && current) {
      socket.emit('chat:leave-room', current)
    }

    set({ currentRoom: room, unreadCount: 0 })

    if (socket) {
      socket.emit('chat:join-room', room)
    }
  },

  sendMessage: (content: string, room: string) => {
    const socket = getSocket()
    if (socket) {
      socket.emit('chat:message', { content, room })
    }
  },

  sendTyping: (room: string, isTyping: boolean) => {
    const socket = getSocket()
    if (socket) {
      socket.emit(isTyping ? 'chat:typing' : 'chat:stop-typing', room)
    }
  },

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
    unreadCount: state.unreadCount + 1,
  })),
  setMessages: (msgs) => set({ messages: msgs }),
  setRooms: (rooms) => set({ rooms }),
  markAsRead: () => set({ unreadCount: 0 }),
  clearChat: () => set({ messages: [], currentRoom: null, isConnected: false }),
}))

