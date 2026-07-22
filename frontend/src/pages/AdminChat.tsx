import { useEffect, useState, useRef } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getConversations, getMessages } from '@/api/chat.api'
import { getSocket } from '@/api/chat.socket'
import { getAllUsers } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import type { ChatRoom } from '@darkitchen/shared'
import styles from './AdminChat.module.css'

export function AdminChat() {
  const { user, token } = useAuthStore()
  const {
    messages,
    setRoom,
    sendMessage,
    sendTyping,
    connect,
    disconnect,
    isTyping,
    setMessages,
  } = useChatStore()

  const [conversations, setConversations] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Connect on mount
  useEffect(() => {
    if (token) {
      connect(token)
      const socket = getSocket()
      if (socket) {
        // Unirse a la sala de notificaciones globales para administradores
        socket.emit('chat:join-admin-room')
        
        // Escuchar cuando haya nuevas conversaciones o mensajes en otras salas
        socket.on('chat:conversations-updated', () => {
          getConversations()
            .then(setConversations)
            .catch((err) => console.error('Failed to update conversations:', err))
        })
      }
    }
    return () => {
      const socket = getSocket()
      if (socket) {
        socket.off('chat:conversations-updated')
      }
      disconnect()
    }
  }, [token, connect, disconnect])

  // Load conversations and users map
  useEffect(() => {
    Promise.all([
      getConversations(),
      getAllUsers()
    ])
      .then(([convs, users]) => {
        setConversations(convs)
        const map: Record<string, string> = {}
        users.forEach(u => map[u.id.toString()] = u.name)
        setUsersMap(map)
      })
      .catch((err) => console.error('Failed to get conversations or users:', err))
  }, [])

  const getRoomName = (room: string) => {
    const match = room.match(/room_client_(\d+)/)
    if (match && usersMap[match[1]]) {
      return usersMap[match[1]]
    }
    return room
  }

  // Change active room
  useEffect(() => {
    if (activeRoom) {
      setRoom(activeRoom)
      getMessages(activeRoom)
        .then(setMessages)
        .catch(err => console.error('Failed to get messages:', err))
    }
  }, [activeRoom, setRoom, setMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Handle typing indicator broadcast
  useEffect(() => {
    if (!activeRoom) return
    
    if (inputMessage.trim().length > 0) {
      sendTyping(activeRoom, true)
    } else {
      sendTyping(activeRoom, false)
    }
    
    const timeout = setTimeout(() => {
      sendTyping(activeRoom, false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [inputMessage, activeRoom, sendTyping])

  const handleSendMessage = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault()
    if (!inputMessage.trim() || !activeRoom || !user) return

    const content = inputMessage.trim()
    setInputMessage('')
    
    const ta = document.getElementById('admin-chat-textarea')
    if (ta) ta.style.height = 'auto'

    sendMessage(content, activeRoom)
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <main className={styles.mainContent}>
        <div className={`glass-card ${styles.chatContainer}`}>
          
          {/* Panel Izquierdo: Lista de Conversaciones */}
          <div className={styles.conversationsPanel}>
            <div className={styles.panelHeader}>
              <h2 className="headline-sm" style={{ color: 'var(--color-text-primary)' }}>Mensajes</h2>
              <span className="badge badge-green">{conversations.length}</span>
            </div>
            
            <div className={styles.conversationsList}>
              {conversations.length === 0 ? (
                 <p style={{ padding: 16, color: 'var(--color-text-muted)' }}>No hay conversaciones aún.</p>
              ) : null}
              {conversations.map(conv => (
                <div 
                  key={conv.room}
                  className={`${styles.conversationItem} ${activeRoom === conv.room ? styles.activeConversation : ''}`}
                  onClick={() => setActiveRoom(conv.room)}
                >
                  <div className={styles.convAvatar}>
                    <span className="material-symbols-outlined">person</span>
                    <span className={styles.headerOnlineDot} />
                  </div>
                  <div className={styles.convDetails}>
                    <p className="body-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{getRoomName(conv.room)}</p>
                    <p className={styles.convPreview}>{conv.lastMessage || 'Nueva conversación'}</p>
                  </div>
                  {conv.unreadCount ? (
                    <div className={styles.unreadBadge}>{conv.unreadCount}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Panel Derecho: Área de Chat */}
          <div className={styles.chatPanel}>
            {activeRoom ? (
              <>
                <div className={styles.chatHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={styles.headerAvatar}>
                      <span className="material-symbols-outlined">person</span>
                      <span className={styles.headerOnlineDot} />
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>{getRoomName(activeRoom)}</p>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 500 }}>
                        Activo
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.messagesArea}>
                  <div className={styles.dateDivider}>
                    <span>Conversación Activa</span>
                  </div>
                  
                  {messages.map((msg) => {
                    const isAdmin = msg.userId === user?.id
                    return (
                      <div key={msg.id} className={`${styles.messageWrapper} ${isAdmin ? styles.wrapperAdmin : styles.wrapperClient}`}>
                        <div className={isAdmin ? 'bubble-admin' : 'bubble-client'}>
                          {!isAdmin && (
                            <p className="label-md" style={{ color: 'var(--color-primary)', marginBottom: 4 }}>
                              {usersMap[msg.userId] || msg.userName || 'Cliente'}
                            </p>
                          )}
                          <p className="body-md">{msg.content}</p>
                          <span className={styles.messageTime}>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                  
                  {isTyping && (
                    <div className={`${styles.messageWrapper} ${styles.wrapperClient}`}>
                      <div className="bubble-client" style={{ display: 'flex', gap: 4, padding: '16px 20px' }}>
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.inputArea} style={{ flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <textarea
                      id="admin-chat-textarea"
                      className="input-field"
                      placeholder="Escribe un mensaje al cliente..."
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      rows={1}
                      style={{ background: 'var(--color-surface-container-lowest)', border: 'none', resize: 'none', overflowY: 'auto' }}
                    />
                    <button 
                      type="button" 
                      onClick={handleSendMessage}
                      className="btn btn-icon btn-primary"
                      disabled={!inputMessage.trim()}
                      style={{ alignSelf: 'flex-end', flexShrink: 0 }}
                    >
                      <span className="material-symbols-outlined">send</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
                    Presiona <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--color-surface-container-high)', fontSize: '0.7rem' }}>Enter</kbd> para enviar · Shift+Enter para nueva línea
                  </p>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--color-border-glass)', marginBottom: 16 }}>forum</span>
                <h3 className="headline-md" style={{ color: 'var(--color-text-primary)' }}>Consola de Atención</h3>
                <p className="body-md" style={{ color: 'var(--color-text-muted)' }}>Selecciona una conversación para comenzar</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

