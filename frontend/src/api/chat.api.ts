import { client } from './client'
import type { ChatRoom, Message } from '@darkitchen/shared'

// Se importan los tipos compartidos para las salas de chat y los mensajes, 
// asegurando un contrato estricto entre el frontend y el backend.
export const getConversations = async (): Promise<ChatRoom[]> => {
  const { data } = await client.get('/messages/user/conversations')
  return data
}

export const getMessages = async (room: string): Promise<Message[]> => {
  const { data } = await client.get(`/messages/${room}`)
  return data
}
