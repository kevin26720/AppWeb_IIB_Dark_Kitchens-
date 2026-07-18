import type { Message, ChatRoom } from '@darkitchen/shared'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    content: '¡Hola! ¿En qué puedo ayudarte hoy?',
    userId: 1,
    userName: 'Chef Admin',
    room: 'room_client_2',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: 2,
    content: 'Quería consultar sobre el menú para una reunión de 20 personas',
    userId: 2,
    userName: 'Cliente Demo',
    room: 'room_client_2',
    createdAt: new Date(Date.now() - 540000).toISOString(),
  },
  {
    id: 3,
    content: 'Por supuesto, puedo ayudarte con un menú corporativo. ¿Tienes alguna preferencia o restricción dietética?',
    userId: 1,
    userName: 'Chef Admin',
    room: 'room_client_2',
    createdAt: new Date(Date.now() - 480000).toISOString(),
  },
]

let MSG_COUNTER = 10

export const mockGetMessages = async (room: string): Promise<Message[]> => {
  await delay(300)
  return MOCK_MESSAGES.filter((m) => m.room === room).slice(-50)
}

export const mockSendMessage = async (content: string, room: string, userId: number, userName: string): Promise<Message> => {
  await delay(100)
  const msg: Message = {
    id: ++MSG_COUNTER,
    content,
    userId,
    userName,
    room,
    createdAt: new Date().toISOString(),
  }
  MOCK_MESSAGES.push(msg)
  return msg
}

export const mockGetConversations = async (): Promise<ChatRoom[]> => {
  await delay(300)
  return [
    {
      room: 'room_client_2',
      lastMessage: 'Por supuesto, puedo ayudarte...',
      lastMessageAt: new Date(Date.now() - 480000).toISOString(),
      unreadCount: 1,
    },
  ]
}
