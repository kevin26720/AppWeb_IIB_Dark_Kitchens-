import { useEffect, useState, useRef } from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { mockGetConversations, mockGetMessages, mockSendMessage } from '@/api/mock/chat.mock'
import { useAuthStore } from '@/store/authStore'
import type { Message, ChatRoom } from '@darkitchen/shared'
import styles from './AdminChat.module.css'

export function AdminChat() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mockGetConversations().then(setConversations)
  }, [])

  useEffect(() => {
    if (activeRoom) {
      mockGetMessages(activeRoom).then(setMessages)
    }
  }, [activeRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !activeRoom || !user) return

    const content = inputMessage.trim()
    setInputMessage('')
    
    // Add local message immediately
    const tempMsg: Message = {
      id: Date.now(),
      content,
      userId: user.id,
      userName: user.name,
      room: activeRoom,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    // Send to mock backend
    await mockSendMessage(content, activeRoom, user.id, user.name)
    const updatedMessages = await mockGetMessages(activeRoom)
    setMessages(updatedMessages)
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
              {conversations.map(conv => (
                <div 
                  key={conv.room}
                  className={`${styles.conversationItem} ${activeRoom === conv.room ? styles.activeConversation : ''}`}
                  onClick={() => setActiveRoom(conv.room)}
                >
                  <div className={styles.convAvatar}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className={styles.convDetails}>
                    <p className="body-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{conv.room}</p>
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
                    </div>
                    <div>
                      <h3 className="headline-sm" style={{ color: 'var(--color-text-primary)' }}>{activeRoom}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="live-dot" />
                        <span className="label-md" style={{ color: 'var(--color-secondary)' }}>Cliente en línea</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.messagesArea}>
                  <div className={styles.dateDivider}>
                    <span>Hoy</span>
                  </div>
                  
                  {messages.map((msg, index) => {
                    const isAdmin = msg.userId === user?.id
                    return (
                      <div key={msg.id} className={`${styles.messageWrapper} ${isAdmin ? styles.wrapperAdmin : styles.wrapperClient}`}>
                        <div className={isAdmin ? 'bubble-admin' : 'bubble-client'}>
                          {!isAdmin && (
                            <p className="label-md" style={{ color: 'var(--color-primary)', marginBottom: 4 }}>
                              {msg.userName}
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

                <form className={styles.inputArea} onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Escribe un mensaje al cliente..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    style={{ background: 'var(--color-surface-container)', border: 'none' }}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-icon btn-primary"
                    disabled={!inputMessage.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>
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
