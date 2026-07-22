import { client } from './client'
import type { ChatRoom, Message } from '@darkitchen/shared'

export const getConversations = async (): Promise<ChatRoom[]> => {
  const { data } = await client.get('/messages/user/conversations')
  return data
}

export const getMessages = async (room: string): Promise<Message[]> => {
  const { data } = await client.get(`/messages/${room}`)
  return data
}
