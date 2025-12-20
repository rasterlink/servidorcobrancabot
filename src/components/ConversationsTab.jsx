import { useState, useEffect } from 'react'
import './ConversationsTab.css'

export default function ConversationsTab({ apiUrl, supabase, selectedAttendant, onSelectAttendant }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [attendants, setAttendants] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([])

  useEffect(() => {
    loadAttendants()
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      const interval = setInterval(() => loadMessages(selectedConversation.id), 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    filterConversations()
  }, [conversations, selectedAttendant])

  const loadAttendants = async () => {
    if (!supabase) {
      setAttendants([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('attendants')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && data) {
        setAttendants(data)
      } else {
        setAttendants([])
      }
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error)
      setAttendants([])
    }
  }

  const filterConversations = () => {
    if (!selectedAttendant) {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter(conv => conv.attendant_id === selectedAttendant.id)
      setFilteredConversations(filtered)
    }
  }

  const loadConversations = async () => {
    try {
      const res = await fetch(`${apiUrl}/conversations`)
      const data = await res.json()
      setConversations(data)

      if (selectedConversation) {
        const updated = data.find(c => c.id === selectedConversation.id)
        if (updated) {
          setSelectedConversation(updated)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/messages`)
      const data = await res.json()
      setMessages(data)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const toggleAI = async (conversationId, currentState) => {
    try {
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/toggle-ai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: !currentState })
      })

      if (res.ok) {
        await loadConversations()
        alert(currentState ? 'IA retomada! Respostas automáticas ativadas.' : 'IA pausada! Agora você pode responder manualmente.')
      }
    } catch (error) {
      console.error('Erro ao alterar status da IA:', error)
      alert('Erro ao alterar status da IA')
    }
  }

  const sendManualMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    setSending(true)
    try {
      const res = await fetch(`${apiUrl}/conversations/${selectedConversation.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput })
      })

      if (res.ok) {
        setMessageInput('')
        await loadMessages(selectedConversation.id)
        await loadConversations()
      } else {
        const error = await res.json()
        alert(error.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const handleSelectConversation = async (conv) => {
    try {
      setSelectedConversation(conv)

      if (supabase && selectedAttendant && !conv.attendant_id) {
        await assignAttendant(conv.id, selectedAttendant.id)
      }
    } catch (error) {
      console.error('Erro ao selecionar conversa:', error)
    }
  }

  const assignAttendant = async (conversationId, attendantId) => {
    if (!supabase) {
      console.warn('Supabase não configurado')
      return
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ attendant_id: attendantId })
        .eq('id', conversationId)

      if (!error) {
        await loadConversations()
      }
    } catch (error) {
      console.error('Erro ao atribuir atendente:', error)
    }
  }

  const formatPhone = (phone) => {
    return phone.replace('@s.whatsapp.net', '')
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  const formatShortTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="conversations-tab">
        <div className="loading">Carregando conversas...</div>
      </div>
    )
  }

  return (
    <div className="conversations-tab">
      <div className="attendant-selector">
        <label>Atendente:</label>
        <select
          value={selectedAttendant?.id || ''}
          onChange={(e) => {
            const attendant = Array.isArray(attendants) ? attendants.find(a => a.id === e.target.value) : null
            onSelectAttendant(attendant || null)
          }}
          className="attendant-select"
        >
          <option value="">Todos os atendentes</option>
          {Array.isArray(attendants) && attendants.map(attendant => (
            <option key={attendant.id} value={attendant.id}>
              {attendant.name}
            </option>
          ))}
        </select>
      </div>

      <div className="conversations-layout">
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h3>💬 Conversas</h3>
            <span className="conversations-count">{Array.isArray(filteredConversations) ? filteredConversations.length : 0}</span>
          </div>
          <div className="conversations-list">
            {!Array.isArray(filteredConversations) || filteredConversations.length === 0 ? (
              <div className="empty-conversations">
                <div>📭</div>
                <p>{selectedAttendant ? 'Nenhuma conversa para este atendente' : 'Nenhuma conversa'}</p>
              </div>
            ) : (
              Array.isArray(filteredConversations) && filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conversation-item-header">
                    <span className="conversation-phone">{formatPhone(conv.customer_phone)}</span>
                    {conv.ai_paused && <span className="ai-paused-badge">⏸️</span>}
                  </div>
                  <div className="conversation-item-preview">
                    <span>{conv.customer_name || 'Cliente não cadastrado'}</span>
                  </div>
                  <div className="conversation-item-time">
                    {formatShortTime(conv.last_message)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="conversation-detail">
          {!selectedConversation ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para ver o histórico e responder</p>
            </div>
          ) : (
            <>
              <div className="detail-header">
                <div className="detail-header-info">
                  <h3>{selectedConversation.customer_name || 'Cliente não cadastrado'}</h3>
                  <p>{formatPhone(selectedConversation.customer_phone)}</p>
                </div>
                <button
                  className={`btn-toggle-ai ${selectedConversation.ai_paused ? 'paused' : 'active'}`}
                  onClick={() => toggleAI(selectedConversation.id, selectedConversation.ai_paused)}
                >
                  {selectedConversation.ai_paused ? '▶️ Retomar IA' : '⏸️ Pausar IA'}
                </button>
              </div>

              <div className="messages-container">
                {loadingMessages && (!Array.isArray(messages) || messages.length === 0) ? (
                  <div className="loading-messages">Carregando mensagens...</div>
                ) : !Array.isArray(messages) || messages.length === 0 ? (
                  <div className="no-messages">Nenhuma mensagem no histórico</div>
                ) : (
                  <div className="message-history">
                    {Array.isArray(messages) && messages.map((msg, index) => (
                      <div key={index} className={`message-item ${msg.role === 'user' ? 'received' : 'sent'}`}>
                        <div className="message-bubble">
                          {msg.message}
                        </div>
                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="message-input-container">
                {selectedConversation.ai_paused && (
                  <div className="ai-paused-notice">
                    ⏸️ IA pausada - Você está no controle manual desta conversa
                  </div>
                )}
                <div className="message-input-wrapper">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Digite sua mensagem..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendManualMessage()}
                    disabled={sending}
                  />
                  <button
                    className="btn-send-message"
                    onClick={sendManualMessage}
                    disabled={sending || !messageInput.trim()}
                  >
                    {sending ? '⏳' : '📤'} Enviar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
