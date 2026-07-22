import { useState, useEffect, useRef, useCallback } from 'react'
import type { Message } from '@darkitchen/shared'


function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSeparator(isoString: string): string {
  const d = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

import { getMessages } from '@/api/chat.api'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import styles from './ChatPage.module.css'

// ─── Chat Bubble ───
interface BubbleProps {
  message: Message
  isOwn: boolean
}

function ChatBubble({ message, isOwn }: BubbleProps) {
  return (
    <div className={`${styles.messageGroup} ${isOwn ? styles.isOwn : styles.isAdmin}`}>
      {!isOwn && (
        <span className={styles.senderName}>{message.userName}</span>
      )}
      <div
        className={`${styles.bubble} ${isOwn ? styles.bubbleClient : styles.bubbleAdmin}`}
      >
        {message.content}
      </div>
      <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
    </div>
  )
}

// ─── ChatPage ───
export function ChatPage() {
  const user     = useAuthStore((s) => s.user)
  const {
    messages,
    isTyping,
    setRoom,
    sendMessage,
    sendTyping,
    connect,
    disconnect,
    markAsRead,
    setMessages,
    isConnected,
  } = useChatStore()

  const [inputValue, setInputValue]   = useState('')
  const [isSending, setIsSending]     = useState(false)
  const [isLoading, setIsLoading]     = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // La sala del cliente
  const roomId = user ? `room_client_${user.id}` : 'room_client_2'

  // Conectar y unirse a sala
  useEffect(() => {
    const token = useAuthStore.getState().token
    if (token) {
      connect(token)
    }
    setRoom(roomId)
    markAsRead()
    getMessages(roomId).then(setMessages).catch(() => {}).finally(() => setIsLoading(false))

    return () => {
      disconnect()
    }
  }, [roomId, connect, disconnect, setRoom, markAsRead, setMessages])

  // Scroll al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Enviar mensaje
  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isSending || !user) return

    setInputValue('')
    setIsSending(true)

    try {
      sendMessage(content, roomId)
    } catch {
      // silencio
    } finally {
      setIsSending(false)
    }
  }

  // Typing indicator broadcast
  useEffect(() => {
    if (inputValue.trim().length > 0) {
      sendTyping(roomId, true)
    } else {
      sendTyping(roomId, false)
    }
    
    const timeout = setTimeout(() => {
      sendTyping(roomId, false)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [inputValue, roomId, sendTyping])

  // Tecla Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }

  // Agrupar mensajes por fecha para separadores
  const renderMessages = () => {
    const rendered: React.ReactNode[] = []
    let lastDate = ''

    messages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toDateString()
      if (dateStr !== lastDate) {
        lastDate = dateStr
        rendered.push(
          <div key={`sep-${msg.createdAt}`} className={styles.dateSeparator}>
            <span className={styles.dateSeparatorText}>
              {formatDateSeparator(msg.createdAt)}
            </span>
          </div>
        )
      }
      rendered.push(
        <ChatBubble
          key={msg.id}
          message={msg}
          isOwn={user ? msg.userId === user.id : false}
        />
      )
    })

    return rendered
  }

  return (
    <div className={styles.chatRoot}>
      {/* ─── Panel izquierdo ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Chat con Darkitchen</h2>
          <p className={styles.sidebarSubtitle}>Habla directamente con nuestro equipo</p>
        </div>

        {/* Tarjeta del chef */}
        <div className={styles.chefCard}>
          <div className={styles.chefAvatarWrapper}>
            <div className={styles.chefAvatar}>restaurant</div>
            <div className={styles.onlineIndicator} />
          </div>
          <div className={styles.chefInfo}>
            <p className={styles.chefName}>Equipo Darkitchen</p>
            <p className={styles.chefStatus}>
              Activo
            </p>
          </div>
        </div>

        {/* Info del usuario */}
        {user && (
          <div className={styles.userInfo}>
            <p className={styles.userInfoTitle}>Tu información</p>
            <div className={styles.userInfoCard}>
              <div className={styles.userInfoRow}>
                <span className="material-symbols-outlined">person</span>
                <span>{user.name ?? 'Cliente'}</span>
              </div>
              <div className={styles.userInfoRow}>
                <span className="material-symbols-outlined">email</span>
                <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sala activa */}
        <div className={styles.roomSection}>
          <p className={styles.roomLabel}>Sala activa</p>
          <div className={styles.roomChip}>
            <span className="material-symbols-outlined">shield_person</span>
            Soporte Privado
          </div>
        </div>
      </aside>

      {/* ─── Panel derecho: Chat ─── */}
      <div className={styles.chatMain}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <div className={styles.headerAvatar}>
              restaurant
              <span className={styles.headerOnlineDot} />
            </div>
            <div>
              <p className={styles.headerChefName}>Equipo Darkitchen</p>
              <p className={styles.headerChefStatus}>
                Activo
              </p>
            </div>
          </div>
          <span
            className={`badge ${isConnected ? 'badge-green' : 'badge-red'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="live-dot" style={{ width: 8, height: 8, backgroundColor: isConnected ? '' : 'var(--color-error)' }} />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Área de mensajes */}
        <div
          className={styles.messagesArea}
          id="chat-messages-area"
          role="log"
          aria-live="polite"
          aria-label="Mensajes del chat"
        >
          {isLoading ? (
            <div className={styles.loadingMessages}>
              <div className={styles.loadingSpinner} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                Cargando mensajes...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyMessages}>
              <div className={styles.emptyIcon}>💬</div>
              <h3>Inicia una conversación</h3>
              <p>
                Escribe tu mensaje y nuestro equipo te responderá en minutos.
              </p>
            </div>
          ) : (
            renderMessages()
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className={styles.typingIndicator}>
              <div className={styles.typingBubble} style={{ padding: '16px 20px', gap: '4px' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.chatInputArea}>
          <div className={styles.inputRow}>
            <textarea
              ref={textareaRef}
              id="chat-message-input"
              className={styles.messageInput}
              placeholder="Escribe un mensaje..."
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              aria-label="Escribe tu mensaje"
            />
            <button
              id="chat-send-btn"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              aria-label="Enviar mensaje"
            >
              send
            </button>
          </div>
          <p
            style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            Presiona <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--color-surface-container-high)', fontSize: '0.7rem' }}>Enter</kbd> para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  )
}
