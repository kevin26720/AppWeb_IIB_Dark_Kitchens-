import { create } from 'zustand'
import type { Message, ChatRoom } from '@darkitchen/shared'

interface ChatState {
  messages: Message[]
  currentRoom: string | null
  isConnected: boolean
  isTyping: boolean
  typingUser: string | null
  rooms: ChatRoom[]
  unreadCount: number

  setRoom: (room: string) => void
  addMessage: (msg: Message) => void
  setMessages: (msgs: Message[]) => void
  setConnected: (connected: boolean) => void
  setTyping: (user: string | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  markAsRead: () => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentRoom: null,
  isConnected: false,
  isTyping: false,
  typingUser: null,
  rooms: [],
  unreadCount: 0,

  setRoom: (room) => set({ currentRoom: room, messages: [], unreadCount: 0 }),
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
    unreadCount: state.unreadCount + 1,
  })),
  setMessages: (msgs) => set({ messages: msgs }),
  setConnected: (connected) => set({ isConnected: connected }),
  setTyping: (user) => set({ typingUser: user, isTyping: !!user }),
  setRooms: (rooms) => set({ rooms }),
  markAsRead: () => set({ unreadCount: 0 }),
  clearChat: () => set({ messages: [], currentRoom: null, isConnected: false }),
}))
