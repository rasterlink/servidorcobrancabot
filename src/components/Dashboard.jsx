import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { FileText, Users, DollarSign, AlertCircle, CheckCircle, Clock, Copy, Webhook } from 'lucide-react'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    recentInvoices: []
  })
  const [loading, setLoading] = useState(true)
  const [webhookLogs, setWebhookLogs] = useState([])
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avisaapp-webhook`

  useEffect(() => {
    loadStats()
    loadWebhookLogs()
  }, [])

  async function loadStats() {
    try {
      const { data: customers } = await supabase.from('customers').select('*')

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, customer:customers(name)')
        .order('created_at', { ascending: false })

      const pending = invoices?.filter(inv => inv.status === 'pending').length || 0
      const paid = invoices?.filter(inv => inv.status === 'paid').length || 0
      const overdue = invoices?.filter(inv => inv.status === 'overdue').length || 0
      const total = invoices?.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) || 0

      setStats({
        totalCustomers: customers?.length || 0,
        totalInvoices: invoices?.length || 0,
        pendingInvoices: pending,
        paidInvoices: paid,
        overdueInvoices: overdue,
        totalAmount: total,
        recentInvoices: invoices?.slice(0, 5) || []
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadWebhookLogs() {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setWebhookLogs(data || [])
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3498db' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalCustomers}</h3>
            <p>Clientes Ativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#9b59b6' }}>
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalInvoices}</h3>
            <p>Total de Boletos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#27ae60' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>R$ {stats.totalAmount.toFixed(2)}</h3>
            <p>Valor Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f39c12' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.pendingInvoices}</h3>
            <p>Pendentes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2ecc71' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.paidInvoices}</h3>
            <p>Pagos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e74c3c' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.overdueInvoices}</h3>
            <p>Vencidos</p>
          </div>
        </div>
      </div>

      <div className="webhook-section">
        <h3><Webhook size={20} /> Configuração do Webhook AvisaApp</h3>
        <div className="webhook-info">
          <div className="webhook-url-container">
            <p className="webhook-label">URL do Webhook:</p>
            <div className="webhook-url-box">
              <code>{webhookUrl}</code>
              <button onClick={copyWebhookUrl} className="copy-btn" title="Copiar URL">
                {copiedWebhook ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="webhook-instructions">
            <h4>Como configurar:</h4>
            <ol>
              <li>Acesse o painel do AvisaApp em <a href="https://www.avisaapi.com.br" target="_blank" rel="noopener noreferrer">avisaapi.com.br</a></li>
              <li>Vá em <strong>Configurações</strong> ou <strong>Webhooks</strong></li>
              <li>Cole a URL acima no campo de webhook</li>
              <li>Salve as configurações</li>
              <li>Envie uma mensagem de teste para verificar se está funcionando</li>
            </ol>
          </div>

          <div className="webhook-logs">
            <h4>Últimos webhooks recebidos ({webhookLogs.length}):</h4>
            {webhookLogs.length === 0 ? (
              <p className="empty-message">Nenhum webhook recebido ainda. Configure o webhook no AvisaApp.</p>
            ) : (
              <div className="logs-list">
                {webhookLogs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className="log-type">{log.event_type}</span>
                      <span className="log-time">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <pre className="log-payload">{JSON.stringify(log.payload, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="recent-invoices">
        <h3>Boletos Recentes</h3>
        {stats.recentInvoices.length === 0 ? (
          <p className="empty-message">Nenhum boleto cadastrado ainda.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Referência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.customer?.name || 'N/A'}</td>
                    <td>R$ {parseFloat(invoice.amount).toFixed(2)}</td>
                    <td>{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</td>
                    <td>{`${invoice.reference_month}/${invoice.reference_year}`}</td>
                    <td>
                      <span className={`status-badge status-${invoice.status}`}>
                        {invoice.status === 'pending' && 'Pendente'}
                        {invoice.status === 'paid' && 'Pago'}
                        {invoice.status === 'overdue' && 'Vencido'}
                        {invoice.status === 'cancelled' && 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
