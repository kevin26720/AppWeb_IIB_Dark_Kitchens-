import { useState, useEffect, useRef, useCallback } from 'react'
import type { Message } from '@darkitchen/shared'
import { mockGetMessages, mockSendMessage } from '@/api/mock/chat.mock'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import styles from './ChatPage.module.css'

// ─── Respuestas automáticas del chef ───
const CHEF_REPLIES = [
  '¡Claro! Puedo ayudarte con eso. 🍽️',
  'Excelente elección. Ese plato es uno de nuestros favoritos.',
  '¿Tienes alguna restricción dietética que deba tener en cuenta?',
  'Para pedidos corporativos, recomendamos nuestro menú ejecutivo.',
  'Perfecto, anotado. ¿Algo más en lo que pueda ayudarte?',
  'Ese plato toma aproximadamente 25 minutos en prepararse. ¿Lo deseas así?',
  '¡Gracias por tu preferencia! Trabajamos con ingredientes frescos cada día.',
  'Podemos personalizar ese plato según tus gustos. ¿Cuál es tu preferencia?',
]

function randomChefReply(): string {
  return CHEF_REPLIES[Math.floor(Math.random() * CHEF_REPLIES.length)]
}

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
    addMessage,
    setMessages,
    setTyping,
    markAsRead,
  } = useChatStore()

  const [inputValue, setInputValue]   = useState('')
  const [isSending, setIsSending]     = useState(false)
  const [isLoading, setIsLoading]     = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  // La sala del cliente
  const roomId = user ? `room_client_${user.id}` : 'room_client_2'

  // Cargar mensajes al montar
  useEffect(() => {
    setRoom(roomId)
    markAsRead()
    mockGetMessages(roomId)
      .then((msgs) => setMessages(msgs))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [roomId, setRoom, markAsRead, setMessages])

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
      const sent = await mockSendMessage(content, roomId, user.id, user.name ?? user.email)
      addMessage(sent)
    } catch {
      // silencio
    } finally {
      setIsSending(false)
    }

    // Simular respuesta del chef
    setTimeout(() => {
      setTyping('Chef Admin')
    }, 500)

    setTimeout(() => {
      setTyping(null)
      const chefMsg: Message = {
        id: Date.now(),
        content: randomChefReply(),
        userId: 1,
        userName: 'Chef Admin',
        room: roomId,
        createdAt: new Date().toISOString(),
      }
      addMessage(chefMsg)
    }, 2000)
  }

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
              <span className="live-dot" style={{ width: 7, height: 7, flexShrink: 0 }} />
              En línea ahora
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
            <span className="material-symbols-outlined">meeting_room</span>
            {roomId}
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
                <span className="live-dot" style={{ width: 7, height: 7 }} />
                Activo · Responde en minutos
              </p>
            </div>
          </div>
          <span
            className="badge badge-green"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="live-dot" style={{ width: 8, height: 8 }} />
            Conectado
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
              <div className={styles.typingBubble}>
                <span className={styles.typingText}>Chef está escribiendo</span>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
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
