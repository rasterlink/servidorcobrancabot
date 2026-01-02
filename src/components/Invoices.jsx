import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit2, Trash2, Upload, Send, Search, Download, Calendar } from 'lucide-react'
import './Invoices.css'

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sendOptions, setSendOptions] = useState({
    sendEmail: true,
    sendWhatsApp: false
  })
  const [formData, setFormData] = useState({
    id: null,
    customer_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    barcode: '',
    pdf_link: '',
    reference_month: new Date().getMonth() + 1,
    reference_year: new Date().getFullYear()
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, statusFilter, invoices])

  async function loadData() {
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, customer:customers(name, email, phone)')
          .order('created_at', { ascending: false }),
        supabase.from('customers').select('*').eq('active', true)
      ])

      setInvoices(invoicesRes.data || [])
      setFilteredInvoices(invoicesRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterInvoices() {
    let filtered = invoices

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    if (searchTerm !== '') {
      filtered = filtered.filter(inv =>
        inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.barcode?.includes(searchTerm)
      )
    }

    setFilteredInvoices(filtered)
  }

  function openModal(invoice = null) {
    if (invoice) {
      setFormData({
        ...invoice,
        due_date: invoice.due_date
      })
    } else {
      setFormData({
        id: null,
        customer_id: '',
        amount: '',
        due_date: '',
        status: 'pending',
        barcode: '',
        pdf_link: '',
        reference_month: new Date().getMonth() + 1,
        reference_year: new Date().getFullYear()
      })
    }
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      const invoiceData = {
        customer_id: formData.customer_id,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status,
        barcode: formData.barcode,
        pdf_link: formData.pdf_link,
        reference_month: parseInt(formData.reference_month),
        reference_year: parseInt(formData.reference_year)
      }

      if (formData.id) {
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', formData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert([invoiceData])

        if (error) throw error
      }

      closeModal()
      loadData()
    } catch (error) {
      console.error('Erro ao salvar boleto:', error)
      alert('Erro ao salvar boleto: ' + error.message)
    }
  }

  async function deleteInvoice(id) {
    if (!confirm('Tem certeza que deseja excluir este boleto?')) return

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Erro ao excluir boleto:', error)
      alert('Erro ao excluir boleto: ' + error.message)
    }
  }

  function openSendModal(invoice) {
    setSelectedInvoice(invoice)
    setSendOptions({
      sendEmail: true,
      sendWhatsApp: false
    })
    setShowSendModal(true)
  }

  function closeSendModal() {
    setShowSendModal(false)
    setSelectedInvoice(null)
  }

  async function handleSendInvoice() {
    if (!selectedInvoice) return

    try {
      const sendType = sendOptions.sendEmail && sendOptions.sendWhatsApp ? 'both' :
                       sendOptions.sendWhatsApp ? 'whatsapp' : 'email'

      if (sendOptions.sendEmail) {
        console.log(`Enviando email para ${selectedInvoice.customer.email}`)
      }

      if (sendOptions.sendWhatsApp && selectedInvoice.customer.phone) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avisaapp-send`
        const message = `Olá ${selectedInvoice.customer.name}! Seu boleto no valor de R$ ${parseFloat(selectedInvoice.amount).toFixed(2)} está disponível. Vencimento: ${new Date(selectedInvoice.due_date).toLocaleDateString('pt-BR')}`

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: selectedInvoice.customer.phone,
            message
          })
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Erro ao enviar mensagem pelo WhatsApp')
        }
      }

      await supabase.from('sending_history').insert([{
        invoice_id: selectedInvoice.id,
        status: 'success',
        send_type: sendType
      }])

      alert(`Boleto enviado com sucesso!`)
      closeSendModal()
      loadData()
    } catch (error) {
      console.error('Erro ao enviar boleto:', error)

      await supabase.from('sending_history').insert([{
        invoice_id: selectedInvoice.id,
        status: 'failed',
        send_type: sendOptions.sendWhatsApp ? 'whatsapp' : 'email',
        error_message: error.message
      }])

      alert('Erro ao enviar boleto: ' + error.message)
    }
  }

  function handleImportCSV(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())

        const invoicesToImport = []

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim())

          if (parts.length < 6) continue

          const [customerEmail, amount, dueDate, month, year, barcode] = parts

          const customer = customers.find(c => c.email === customerEmail)
          if (!customer) {
            console.warn(`Cliente não encontrado: ${customerEmail}`)
            continue
          }

          invoicesToImport.push({
            customer_id: customer.id,
            amount: parseFloat(amount),
            due_date: dueDate,
            status: 'pending',
            barcode: barcode || '',
            pdf_link: parts[6] || '',
            reference_month: parseInt(month),
            reference_year: parseInt(year)
          })
        }

        if (invoicesToImport.length > 0) {
          const { error } = await supabase
            .from('invoices')
            .insert(invoicesToImport)

          if (error) throw error

          alert(`${invoicesToImport.length} boletos importados com sucesso!`)
          setShowImportModal(false)
          loadData()
        } else {
          alert('Nenhum boleto válido encontrado no arquivo.')
        }
      } catch (error) {
        console.error('Erro ao importar CSV:', error)
        alert('Erro ao importar CSV: ' + error.message)
      }
    }
    reader.readAsText(file)
  }

  function downloadSampleCSV() {
    const sampleCSV = `email_cliente,valor,vencimento,mes,ano,codigo_barras,link_pdf
exemplo@email.com,150.50,2025-01-15,1,2025,123456789,https://link-do-pdf.com`

    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exemplo_importacao_boletos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="invoices">
      <div className="page-header">
        <h2 className="page-title">Gerenciar Boletos</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            <Upload size={20} />
            Importar CSV
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={20} />
            Novo Boleto
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente ou código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos Status</option>
          <option value="pending">Pendentes</option>
          <option value="paid">Pagos</option>
          <option value="overdue">Vencidos</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum boleto encontrado.</p>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => openModal()}>
              Adicionar Primeiro Boleto
            </button>
            <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
              Importar de CSV
            </button>
          </div>
        </div>
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.customer?.name || 'N/A'}</td>
                  <td>R$ {parseFloat(invoice.amount).toFixed(2)}</td>
                  <td>
                    <span className="date-cell">
                      <Calendar size={16} />
                      {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td>{`${invoice.reference_month}/${invoice.reference_year}`}</td>
                  <td>
                    <span className={`status-badge status-${invoice.status}`}>
                      {invoice.status === 'pending' && 'Pendente'}
                      {invoice.status === 'paid' && 'Pago'}
                      {invoice.status === 'overdue' && 'Vencido'}
                      {invoice.status === 'cancelled' && 'Cancelado'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-send"
                        onClick={() => openSendModal(invoice)}
                        title="Enviar"
                      >
                        <Send size={18} />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openModal(invoice)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => deleteInvoice(invoice.id)}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{formData.id ? 'Editar Boleto' : 'Novo Boleto'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cliente *</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mês *</label>
                  <select
                    required
                    value={formData.reference_month}
                    onChange={(e) => setFormData({...formData, reference_month: e.target.value})}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ano *</label>
                  <input
                    type="number"
                    required
                    value={formData.reference_year}
                    onChange={(e) => setFormData({...formData, reference_year: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Código de Barras</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Link do PDF</label>
                <input
                  type="url"
                  value={formData.pdf_link}
                  onChange={(e) => setFormData({...formData, pdf_link: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {formData.id ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Importar Boletos via CSV</h3>

            <div className="import-instructions">
              <p>O arquivo CSV deve conter as seguintes colunas:</p>
              <code>email_cliente, valor, vencimento, mes, ano, codigo_barras, link_pdf</code>

              <button className="btn btn-secondary download-sample" onClick={downloadSampleCSV}>
                <Download size={18} />
                Baixar Arquivo de Exemplo
              </button>
            </div>

            <div className="form-group">
              <label>Selecionar arquivo CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="file-input"
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && selectedInvoice && (
        <div className="modal-overlay" onClick={closeSendModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enviar Boleto</h3>

            <div className="send-info">
              <p><strong>Cliente:</strong> {selectedInvoice.customer.name}</p>
              <p><strong>Valor:</strong> R$ {parseFloat(selectedInvoice.amount).toFixed(2)}</p>
              <p><strong>Vencimento:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString('pt-BR')}</p>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendOptions.sendEmail}
                  onChange={(e) => setSendOptions({...sendOptions, sendEmail: e.target.checked})}
                />
                Enviar por Email ({selectedInvoice.customer.email})
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendOptions.sendWhatsApp}
                  onChange={(e) => setSendOptions({...sendOptions, sendWhatsApp: e.target.checked})}
                  disabled={!selectedInvoice.customer.phone}
                />
                Enviar por WhatsApp via AvisaApp
                {selectedInvoice.customer.phone ? ` (${selectedInvoice.customer.phone})` : ' (sem telefone)'}
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={closeSendModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendInvoice}
                disabled={!sendOptions.sendEmail && !sendOptions.sendWhatsApp}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Invoices
