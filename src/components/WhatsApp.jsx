import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, RefreshCw, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import QRCode from 'qrcode'
import './WhatsApp.css'

function WhatsApp() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [formData, setFormData] = useState({
    name: ''
  })

  useEffect(() => {
    loadConnections()
    const interval = setInterval(loadConnections, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadConnections() {
    try {
      const { data } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .order('created_at', { ascending: false })
      setConnections(data || [])
    } catch (error) {
      console.error('Erro ao carregar conexões:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal() {
    setFormData({ name: '' })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setQrCodeUrl('')
    setSelectedConnection(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const { data: newConnection, error } = await supabase
        .from('whatsapp_connections')
        .insert([{
          name: formData.name,
          status: 'scanning',
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      await initializeConnection(newConnection.id)
      closeModal()
      loadConnections()
    } catch (error) {
      console.error('Erro ao criar conexão:', error)
      alert('Erro ao criar conexão: ' + error.message)
    }
  }

  async function initializeConnection(connectionId) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-manager`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initialize',
          connectionId
        })
      })

      const result = await response.json()

      if (result.success && result.qrCode) {
        setSelectedConnection(connectionId)
        await generateQRCode(result.qrCode)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Erro ao inicializar conexão:', error)
    }
  }

  async function generateQRCode(qrData) {
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Erro ao gerar QR code:', error)
    }
  }

  async function showQRCode(connection) {
    setSelectedConnection(connection.id)

    if (connection.qr_code) {
      await generateQRCode(connection.qr_code)
      setShowModal(true)
    } else {
      await initializeConnection(connection.id)
    }
  }

  async function refreshConnection(connectionId) {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-manager`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh',
          connectionId
        })
      })

      loadConnections()
    } catch (error) {
      console.error('Erro ao atualizar conexão:', error)
    }
  }

  async function deleteConnection(id) {
    if (!confirm('Tem certeza que deseja excluir esta conexão?')) return

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-manager`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          connectionId: id
        })
      })

      const { error } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadConnections()
    } catch (error) {
      console.error('Erro ao excluir conexão:', error)
      alert('Erro ao excluir conexão: ' + error.message)
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'connected':
        return <CheckCircle size={20} className="status-icon connected" />
      case 'scanning':
        return <Clock size={20} className="status-icon scanning" />
      case 'error':
        return <XCircle size={20} className="status-icon error" />
      default:
        return <XCircle size={20} className="status-icon disconnected" />
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'connected':
        return 'Conectado'
      case 'scanning':
        return 'Aguardando QR Code'
      case 'error':
        return 'Erro'
      default:
        return 'Desconectado'
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="whatsapp">
      <div className="page-header">
        <h2 className="page-title">Conexões WhatsApp</h2>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={20} />
          Nova Conexão
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="empty-state">
          <MessageCircle size={64} className="empty-icon" />
          <p>Nenhuma conexão WhatsApp configurada.</p>
          <button className="btn btn-primary" onClick={openModal}>
            Adicionar Primeira Conexão
          </button>
        </div>
      ) : (
        <div className="connections-grid">
          {connections.map(connection => (
            <div key={connection.id} className="connection-card">
              <div className="connection-header">
                <div className="connection-name">
                  <MessageCircle size={24} />
                  <h3>{connection.name}</h3>
                </div>
                {getStatusIcon(connection.status)}
              </div>

              <div className="connection-info">
                <div className="info-row">
                  <span className="label">Número:</span>
                  <span className="value">{connection.phone_number || 'Não conectado'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Status:</span>
                  <span className={`value status-${connection.status}`}>
                    {getStatusText(connection.status)}
                  </span>
                </div>
                {connection.last_connected_at && (
                  <div className="info-row">
                    <span className="label">Última conexão:</span>
                    <span className="value">
                      {new Date(connection.last_connected_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="connection-actions">
                {connection.status !== 'connected' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => showQRCode(connection)}
                  >
                    Ver QR Code
                  </button>
                )}
                <button
                  className="btn-icon btn-refresh"
                  onClick={() => refreshConnection(connection.id)}
                  title="Atualizar"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => deleteConnection(connection.id)}
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal qr-modal" onClick={(e) => e.stopPropagation()}>
            {qrCodeUrl ? (
              <>
                <h3>Escaneie o QR Code</h3>
                <div className="qr-container">
                  <img src={qrCodeUrl} alt="QR Code" />
                </div>
                <div className="qr-instructions">
                  <ol>
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Toque em Mais opções (⋮) e selecione "Aparelhos conectados"</li>
                    <li>Toque em "Conectar um aparelho"</li>
                    <li>Aponte seu celular para esta tela para escanear o código</li>
                  </ol>
                </div>
                <button className="btn btn-secondary" onClick={closeModal}>
                  Fechar
                </button>
              </>
            ) : (
              <>
                <h3>Nova Conexão WhatsApp</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Nome da Conexão *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: WhatsApp Vendas, WhatsApp Suporte"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Criar Conexão
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WhatsApp
