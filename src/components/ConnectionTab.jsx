import { useState, useEffect } from 'react'
import './ConnectionTab.css'

export default function ConnectionTab({ apiUrl }) {
  const [qrCode, setQrCode] = useState(null)
  const [status, setStatus] = useState('disconnected')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let ws = null
    let reconnectTimeout = null
    let isMounted = true

    const connectWebSocket = () => {
      if (!isMounted) return

      try {
        const wsUrl = apiUrl.replace('http', 'ws')
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('WebSocket conectado')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'qr') {
              setQrCode(data.data)
            } else if (data.type === 'status') {
              setStatus(data.status)
              if (data.status === 'connected') {
                setQrCode(null)
              }
            }
          } catch (error) {
            console.warn('Erro ao processar mensagem WebSocket')
          }
        }

        ws.onerror = () => {
          console.warn('WebSocket: tentando reconectar...')
        }

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(() => {
              if (isMounted) {
                connectWebSocket()
              }
            }, 5000)
          }
        }
      } catch (error) {
        console.warn('WebSocket: falha na conexão, tentando novamente...')
        if (isMounted) {
          reconnectTimeout = setTimeout(() => {
            if (isMounted) {
              connectWebSocket()
            }
          }, 5000)
        }
      }
    }

    connectWebSocket()

    return () => {
      isMounted = false
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        try {
          ws.close()
        } catch (error) {
          console.warn('Erro ao fechar WebSocket')
        }
      }
    }
  }, [apiUrl])

  const checkStatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/status`)
      const data = await res.json()
      setStatus(data.status)
      if (data.qr) {
        setQrCode(data.qr)
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/connect`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setTimeout(checkStatus, 2000)
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      alert('Erro ao conectar ao WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch(`${apiUrl}/disconnect`, { method: 'POST' })
      setQrCode(null)
      setStatus('disconnected')
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="connection-tab">
      <div className="connection-header">
        <h2>Conexão WhatsApp</h2>
        <p className="connection-subtitle">
          {status === 'connected'
            ? '✅ WhatsApp conectado e pronto para usar!'
            : '📱 Conecte seu WhatsApp para começar'}
        </p>
      </div>

      <div className="connection-status-card">
        <div className={`status-indicator ${status}`}>
          <div className="status-icon"></div>
          <div>
            <h3>Status da Conexão</h3>
            <p>{status === 'connected' ? 'Conectado' : 'Desconectado'}</p>
          </div>
        </div>
      </div>

      <div className="connection-actions">
        {status === 'disconnected' ? (
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Conectando...' : '🔌 Conectar WhatsApp'}
          </button>
        ) : (
          <button
            className="btn btn-danger"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? 'Desconectando...' : '🔴 Desconectar'}
          </button>
        )}
      </div>

      {qrCode && (
        <div className="qr-container">
          <div className="qr-card">
            <h3>Escaneie o QR Code</h3>
            <p>Abra o WhatsApp no celular e escaneie este código</p>
            <div className="qr-code">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`}
                alt="QR Code"
              />
            </div>
            <div className="qr-instructions">
              <p>📱 <strong>Como escanear:</strong></p>
              <ol>
                <li>Abra o WhatsApp no seu celular</li>
                <li>Toque em <strong>Menu (⋮)</strong> ou <strong>Configurações</strong></li>
                <li>Toque em <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Aponte a câmera para este código</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {status === 'connected' && !qrCode && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h3>WhatsApp Conectado!</h3>
          <p>Seu bot está pronto para receber e responder mensagens automaticamente.</p>
          <div className="next-steps">
            <h4>Próximos passos:</h4>
            <ul>
              <li>Configure sua chave OpenAI na aba <strong>Configurações</strong></li>
              <li>Teste a IA na aba <strong>Testar IA</strong></li>
              <li>Veja as conversas na aba <strong>Conversas</strong></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
