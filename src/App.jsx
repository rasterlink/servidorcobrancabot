import { useState, useEffect } from 'react'
import './App.css'
import ConnectionTab from './components/ConnectionTab'
import ConfigTab from './components/ConfigTab'
import ConversationsTab from './components/ConversationsTab'
import TestAITab from './components/TestAITab'
import CustomersTab from './components/CustomersTab'
import AttendantsTab from './components/AttendantsTab'
import { createClient } from '@supabase/supabase-js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Inicializar Supabase com verificação de variáveis
let supabase = null
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
  } else {
    console.warn('Variáveis do Supabase não configuradas')
  }
} catch (error) {
  console.error('Erro ao inicializar Supabase:', error)
}

function App() {
  const [activeTab, setActiveTab] = useState('connection')
  const [serverStatus, setServerStatus] = useState('offline')
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [selectedAttendant, setSelectedAttendant] = useState(null)

  useEffect(() => {
    checkServerStatus()
    const interval = setInterval(checkServerStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    connectWebSocket()
  }, [])

  const checkServerStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/`)
      if (res.ok) {
        setServerStatus('online')
        const data = await res.json()
        setWhatsappStatus(data.connection || 'disconnected')
      }
    } catch {
      setServerStatus('offline')
    }
  }

  const connectWebSocket = () => {
    try {
      const wsUrl = API_URL.replace('http', 'ws')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setWsStatus('connected')
      }

      ws.onerror = () => {
        setWsStatus('disconnected')
      }

      ws.onclose = () => {
        setWsStatus('disconnected')
        setTimeout(connectWebSocket, 3000)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'status') {
            setWhatsappStatus(data.status)
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
      setWsStatus('disconnected')
      setTimeout(connectWebSocket, 5000)
    }
  }

  const tabs = [
    { id: 'connection', label: 'Conexão', icon: '🔌' },
    { id: 'customers', label: 'Clientes', icon: '👥' },
    { id: 'attendants', label: 'Atendentes', icon: '👤' },
    { id: 'conversations', label: 'Conversas', icon: '💬' },
    { id: 'test', label: 'Testar IA', icon: '🤖' },
    { id: 'config', label: 'Configurações', icon: '⚙️' }
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>WhatsApp + OpenAI</h1>
        <div className="status-indicators">
          <div className={`status-badge ${serverStatus}`}>
            <span className="status-dot"></span>
            Servidor: {serverStatus === 'online' ? 'Online' : 'Offline'}
          </div>
          <div className={`status-badge ${wsStatus}`}>
            <span className="status-dot"></span>
            WebSocket: {wsStatus === 'connected' ? 'Conectado' : 'Desconectado'}
          </div>
          <div className={`status-badge ${whatsappStatus}`}>
            <span className="status-dot"></span>
            Status: {whatsappStatus === 'connected' ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {activeTab === 'connection' && <ConnectionTab apiUrl={API_URL} />}
        {activeTab === 'customers' && <CustomersTab apiUrl={API_URL} />}
        {activeTab === 'attendants' && <AttendantsTab supabase={supabase} />}
        {activeTab === 'config' && <ConfigTab apiUrl={API_URL} />}
        {activeTab === 'conversations' && (
          <ConversationsTab
            apiUrl={API_URL}
            supabase={supabase}
            selectedAttendant={selectedAttendant}
            onSelectAttendant={setSelectedAttendant}
          />
        )}
        {activeTab === 'test' && <TestAITab apiUrl={API_URL} />}
      </main>
    </div>
  )
}

export default App
