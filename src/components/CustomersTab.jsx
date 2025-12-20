import { useState, useEffect } from 'react'
import './CustomersTab.css'

export default function CustomersTab({ apiUrl }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    amount_due: '',
    due_date: '',
    invoice_number: '',
    notes: '',
    status: 'pending'
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const res = await fetch(`${apiUrl}/customers`)
      const data = await res.json()
      setCustomers(data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId
        ? `${apiUrl}/customers/${editingId}`
        : `${apiUrl}/customers`

      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        await loadCustomers()
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      await fetch(`${apiUrl}/customers/${id}`, { method: 'DELETE' })
      await loadCustomers()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
    }
  }

  const handleEdit = (customer) => {
    setEditingId(customer.id)
    setFormData({
      phone: customer.phone,
      name: customer.name,
      amount_due: customer.amount_due,
      due_date: customer.due_date || '',
      invoice_number: customer.invoice_number || '',
      notes: customer.notes || '',
      status: customer.status
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      phone: '',
      name: '',
      amount_due: '',
      due_date: '',
      invoice_number: '',
      notes: '',
      status: 'pending'
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim())

        const customers = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const customer = {}
          headers.forEach((header, index) => {
            customer[header] = values[index] || ''
          })
          return customer
        })

        setLoading(true)
        const res = await fetch(`${apiUrl}/customers/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customers })
        })

        if (res.ok) {
          const result = await res.json()
          await loadCustomers()

          let message = `✅ Importação concluída!\n\n`
          message += `📥 ${result.imported} cliente(s) importado(s)\n`

          if (result.markedAsPaid > 0) {
            message += `💰 ${result.markedAsPaid} cliente(s) marcado(s) como PAGO (não estavam na nova lista):\n`
            message += result.paidCustomers.join(', ')
          }

          alert(message)
        }
      } catch (error) {
        console.error('Erro ao importar CSV:', error)
        alert('Erro ao importar CSV. Verifique o formato do arquivo.')
      } finally {
        setLoading(false)
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendente', class: 'badge-pending' },
      negotiating: { label: 'Negociando', class: 'badge-negotiating' },
      paid: { label: 'Pago', class: 'badge-paid' },
      overdue: { label: 'Vencido', class: 'badge-overdue' }
    }
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  return (
    <div className="customers-tab">
      <div className="customers-header">
        <h2>Clientes</h2>
        <div className="customers-actions">
          <label className="btn btn-secondary">
            Importar CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Adicionar Cliente'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="customer-form">
          <h3>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Telefone (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="5511999999999@s.whatsapp.net"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
                <small>Formato: 55 + DDD + Número + @s.whatsapp.net</small>
              </div>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valor Devido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount_due}
                  onChange={(e) => setFormData({...formData, amount_due: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Data de Vencimento</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Número da Fatura</label>
                <input
                  type="text"
                  placeholder="Ex: INV-2024-001"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Pendente</option>
                  <option value="negotiating">Negociando</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Observações</label>
              <textarea
                rows={3}
                placeholder="Informações adicionais sobre o cliente..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="customers-list">
        {customers.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum cliente cadastrado</p>
            <p>Adicione clientes manualmente ou importe um arquivo CSV</p>
          </div>
        ) : (
          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Valor Devido</th>
                  <th>Vencimento</th>
                  <th>Fatura</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td className="phone-cell">{customer.phone}</td>
                    <td className="amount-cell">R$ {parseFloat(customer.amount_due).toFixed(2)}</td>
                    <td>{customer.due_date ? new Date(customer.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{customer.invoice_number || '-'}</td>
                    <td>{getStatusBadge(customer.status)}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(customer)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(customer.id)}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="csv-instructions">
        <h3>Formato do CSV para Importação</h3>
        <p>O arquivo CSV deve ter as seguintes colunas (na primeira linha):</p>
        <code>phone,name,amount_due,due_date,invoice_number,notes,status</code>
        <p>Exemplo:</p>
        <code>5511999999999@s.whatsapp.net,João Silva,150.50,2024-12-25,INV-001,Cliente antigo,pending</code>
      </div>
    </div>
  )
}
