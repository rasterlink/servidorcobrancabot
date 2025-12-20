import { useState } from 'react'
import './TestAITab.css'

export default function TestAITab({ apiUrl }) {
  const [message, setMessage] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTest = async () => {
    if (!message.trim()) return

    setLoading(true)
    setError('')
    setReply('')

    try {
      const res = await fetch(`${apiUrl}/test-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      const data = await res.json()

      if (res.ok) {
        setReply(data.reply)
      } else {
        setError(data.error || 'Erro ao testar IA')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTest()
    }
  }

  return (
    <div className="test-ai-tab">
      <div className="test-header">
        <h2>🤖 Testar IA</h2>
        <p>Envie uma mensagem de teste para ver como a IA responderá</p>
      </div>

      <div className="test-container">
        <div className="test-input-area">
          <label>💬 Sua mensagem</label>
          <textarea
            className="test-input"
            rows={4}
            placeholder="Digite uma mensagem de teste..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="btn btn-test"
            onClick={handleTest}
            disabled={loading || !message.trim()}
          >
            {loading ? '⏳ Processando...' : '🚀 Enviar Teste'}
          </button>
        </div>

        {error && (
          <div className="test-error">
            <div className="error-icon">❌</div>
            <div>
              <h4>Erro</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {reply && (
          <div className="test-reply">
            <div className="reply-header">
              <span className="reply-icon">🤖</span>
              <span>Resposta da IA</span>
            </div>
            <div className="reply-content">
              {reply}
            </div>
          </div>
        )}

        {!reply && !error && !loading && (
          <div className="test-placeholder">
            <div className="placeholder-icon">💭</div>
            <p>A resposta da IA aparecerá aqui</p>
          </div>
        )}
      </div>

      <div className="test-tips">
        <h3>💡 Dicas</h3>
        <ul>
          <li>Teste diferentes tipos de mensagens para ver como a IA responde</li>
          <li>Ajuste o prompt nas Configurações se as respostas não estiverem boas</li>
          <li>Use Shift+Enter para quebrar linha na mensagem</li>
          <li>Certifique-se de ter configurado sua chave OpenAI</li>
        </ul>
      </div>
    </div>
  )
}
