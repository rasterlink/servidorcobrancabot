import { useState, useEffect } from 'react'
import './CustomersTab.css'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function CustomersTab({ apiUrl }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
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
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const customerData = {
        phone: formData.phone,
        name: formData.name,
        amount_due: parseFloat(formData.amount_due) || 0,
        due_date: formData.due_date || null,
        invoice_number: formData.invoice_number || '',
        notes: formData.notes || '',
        status: formData.status
      }

      let error
      if (editingId) {
        const result = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingId)
        error = result.error
      } else {
        const result = await supabase
          .from('customers')
          .insert([customerData])
        error = result.error
      }

      if (error) throw error

      await loadCustomers()
      resetForm()
      alert(editingId ? 'Cliente atualizado com sucesso!' : 'Cliente adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert(`Erro ao salvar cliente: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCustomers()
      alert('Cliente excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert(`Erro ao excluir cliente: ${error.message}`)
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

  const parseCSVLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const normalizePhone = (phone) => {
    if (!phone) return ''

    let cleaned = phone.replace(/\D/g, '')

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }

    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }

    if (cleaned.length === 12) {
      cleaned = cleaned.slice(0, 4) + '9' + cleaned.slice(4)
    }

    return cleaned + '@s.whatsapp.net'
  }

  const convertToStandardFormat = (rawData, headers) => {
    const hasNameColumn = headers.some(h =>
      h.toLowerCase().includes('nome') || h.toLowerCase().includes('razao')
    )

    if (hasNameColumn) {
      const getIndex = (keywords) => {
        return headers.findIndex(h => {
          const lower = h.toLowerCase()
          return keywords.some(keyword => lower.includes(keyword.toLowerCase()))
        })
      }

      const nameIndex = getIndex(['nome', 'razao'])
      const phoneIndex = getIndex(['celular', 'telefone celular'])
      const valueIndex = headers.findIndex(h => h.trim().toUpperCase() === 'VALOR COM JUROS')
      const dueDateIndex = getIndex(['vencimento'])
      const invoiceIndex = getIndex(['proposta'])
      const overdueIndex = getIndex(['parcelas vencidas'])
      const plateIndex = getIndex(['placa'])
      const chassisIndex = getIndex(['chassi'])
      const brandIndex = getIndex(['marca'])
      const modelIndex = getIndex(['modelo'])
      const documentIndex = getIndex(['cnpj', 'cpf'])
      const contractStatusIndex = getIndex(['situação'])
      const trackerIdIndex = getIndex(['rastreador id'])
      const renewalIndex = getIndex(['renovação'])
      const installationDateIndex = getIndex(['data instalação'])
      const validityDateIndex = getIndex(['data vigência'])
      const sellerIndex = getIndex(['vendedor'])
      const vehicleValueIndex = getIndex(['valor veiculo'])
      const proposalValueIndex = getIndex(['valor proposta'])

      // Colunas específicas para valor de parcela e valor total com juros
      const installmentValueIndex = headers.findIndex(h => {
        const clean = h.trim().toUpperCase().replace(/\s+/g, ' ')
        return clean === 'VALOR DA PARCELA' || clean.includes('PARCELA')
      })
      const totalValueIndex = headers.findIndex(h => {
        const clean = h.trim().toUpperCase()
        return clean === 'VALOR COM JUROS'
      })

      const rawDataObject = {}
      headers.forEach((header, index) => {
        if (rawData[index]) {
          rawDataObject[header] = rawData[index]
        }
      })

      console.log('🔍 Debug CSV Headers:', headers)
      console.log('🔍 Debug - valueIndex (amount_due):', valueIndex, 'header:', headers[valueIndex], 'valor:', rawData[valueIndex])
      console.log('🔍 Debug - installmentValueIndex:', installmentValueIndex, 'header:', headers[installmentValueIndex], 'valor:', rawData[installmentValueIndex])
      console.log('🔍 Debug - totalValueIndex:', totalValueIndex, 'header:', headers[totalValueIndex], 'valor:', rawData[totalValueIndex])

      return {
        name: rawData[nameIndex] || '',
        phone: normalizePhone(rawData[phoneIndex] || ''),
        amount_due: extractValue(rawData[valueIndex]) || '0',
        due_date: formatDate(rawData[dueDateIndex]),
        invoice_number: rawData[invoiceIndex] || '',
        notes: buildNotes(rawData, overdueIndex, plateIndex),
        status: determineStatus(rawData[overdueIndex], rawData[dueDateIndex]),
        vehicle_plate: rawData[plateIndex] || '',
        vehicle_chassis: rawData[chassisIndex] || '',
        vehicle_brand: rawData[brandIndex] || '',
        vehicle_model: rawData[modelIndex] || '',
        document: rawData[documentIndex] || '',
        contract_status: rawData[contractStatusIndex] || '',
        overdue_installments: parseInt(rawData[overdueIndex] || '0') || 0,
        tracker_id: rawData[trackerIdIndex] || '',
        renewal_status: rawData[renewalIndex] || '',
        contract_renewal: rawData[renewalIndex] || '',
        installation_date: formatDate(rawData[installationDateIndex]),
        validity_date: formatDate(rawData[validityDateIndex]),
        seller: rawData[sellerIndex] || '',
        installment_value: extractValue(rawData[installmentValueIndex]) || '0',
        total_value: extractValue(rawData[totalValueIndex]) || '0',
        raw_data: rawDataObject
      }
    }

    return {
      phone: rawData[headers.indexOf('phone')] || '',
      name: rawData[headers.indexOf('name')] || '',
      amount_due: rawData[headers.indexOf('amount_due')] || '',
      due_date: rawData[headers.indexOf('due_date')] || '',
      invoice_number: rawData[headers.indexOf('invoice_number')] || '',
      notes: rawData[headers.indexOf('notes')] || '',
      status: rawData[headers.indexOf('status')] || 'pending'
    }
  }

  const extractValue = (valueStr) => {
    if (!valueStr) return '0'
    const cleaned = valueStr.replace(/[^\d,.-]/g, '').replace(',', '.')
    return cleaned || '0'
  }

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null

    const cleaned = dateStr.trim().replace(/[()]/g, '')

    if (cleaned.includes('(') || cleaned.length > 15) {
      return null
    }

    const parts = cleaned.split('/')
    if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2) {
      const day = parts[0].padStart(2, '0')
      const month = parts[1].padStart(2, '0')
      const year = parts[2]

      if (parseInt(day) > 0 && parseInt(day) <= 31 && parseInt(month) > 0 && parseInt(month) <= 12) {
        return `${year}-${month}-${day}`
      }
    }

    return null
  }

  const buildNotes = (rawData, overdueIndex, plateIndex) => {
    const notes = []

    if (overdueIndex >= 0 && rawData[overdueIndex]) {
      const overdue = rawData[overdueIndex]
      if (overdue && overdue !== '0') {
        notes.push(`${overdue} parcela(s) vencida(s)`)
      }
    }

    if (plateIndex >= 0 && rawData[plateIndex]) {
      notes.push(`Placa: ${rawData[plateIndex]}`)
    }

    return notes.join(' | ')
  }

  const determineStatus = (overdueStr, dueDateStr) => {
    if (overdueStr && parseInt(overdueStr) > 0) {
      return 'overdue'
    }

    if (dueDateStr) {
      const dueDate = new Date(formatDate(dueDateStr))
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        return 'overdue'
      }
    }

    return 'pending'
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) {
      console.log('Nenhum arquivo selecionado')
      return
    }

    console.log('📁 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        console.log('📄 Lendo arquivo...')
        const text = event.target.result
        console.log('✅ Arquivo lido. Tamanho do texto:', text.length, 'caracteres')

        const lines = text.split('\n').filter(line => line.trim())
        console.log('📊 Linhas encontradas:', lines.length)

        const headers = parseCSVLine(lines[0]).map(h => h.trim())
        console.log('📋 Headers:', headers)

        const customers = lines.slice(1)
          .map(line => {
            const values = parseCSVLine(line)
            const customer = convertToStandardFormat(values, headers)
            console.log('👤 Cliente processado:', customer.name, customer.phone)
            return customer
          })
          .filter(c => c.phone && c.name)

        console.log('✅ Clientes válidos:', customers.length)

        if (customers.length === 0) {
          alert('⚠️ Nenhum cliente válido encontrado no arquivo.\nVerifique se há telefone e nome nas colunas.')
          e.target.value = ''
          return
        }

        setLoading(true)
        console.log('🚀 Processando importação...')

        // Buscar clientes existentes que não estão pagos
        const { data: existingCustomers } = await supabase
          .from('customers')
          .select('id, phone, name, status, notes')
          .neq('status', 'paid')

        console.log('📊 Clientes existentes:', existingCustomers?.length || 0)

        // Telefones da nova lista
        const newPhones = customers.map(c => c.phone)

        // Clientes que não estão mais na nova lista = pagaram
        const customersToMarkAsPaid = existingCustomers
          ? existingCustomers.filter(c => !newPhones.includes(c.phone))
          : []

        console.log('💰 Clientes a marcar como pago:', customersToMarkAsPaid.length)

        // Marcar como pago os que não estão mais na lista
        if (customersToMarkAsPaid.length > 0) {
          const today = new Date().toISOString().split('T')[0]

          for (const customer of customersToMarkAsPaid) {
            await supabase
              .from('customers')
              .update({
                status: 'paid',
                notes: customer.notes
                  ? `${customer.notes}\n\n[${today}] Marcado como pago automaticamente - removido da lista de devedores`
                  : `[${today}] Marcado como pago automaticamente - removido da lista de devedores`
              })
              .eq('id', customer.id)
          }
        }

        // Preparar dados para inserção
        const validCustomers = customers.map(c => {
          const cleanDate = (dateStr) => {
            if (!dateStr || typeof dateStr !== 'string') return null
            if (dateStr.includes('(') || dateStr.includes(')')) return null
            if (dateStr.length > 15) return null
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null
            return dateStr
          }

          return {
            phone: c.phone,
            name: c.name,
            amount_due: parseFloat(c.amount_due) || 0,
            due_date: cleanDate(c.due_date),
            invoice_number: c.invoice_number || '',
            notes: c.notes || '',
            status: c.status || 'pending',
            vehicle_plate: c.vehicle_plate || null,
            vehicle_chassis: c.vehicle_chassis || null,
            vehicle_brand: c.vehicle_brand || null,
            vehicle_model: c.vehicle_model || null,
            document: c.document || null,
            contract_status: c.contract_status || null,
            overdue_installments: c.overdue_installments || 0,
            tracker_id: c.tracker_id || null,
            renewal_status: c.renewal_status || null,
            contract_renewal: c.contract_renewal || null,
            installation_date: cleanDate(c.installation_date),
            validity_date: cleanDate(c.validity_date),
            seller: c.seller || null,
            installment_value: c.installment_value ? parseFloat(c.installment_value) : null,
            total_value: c.total_value ? parseFloat(c.total_value) : null,
            raw_data: c.raw_data || {}
          }
        })

        console.log('📥 Importando', validCustomers.length, 'clientes...')

        // Inserir/atualizar clientes (upsert por telefone)
        const { data: importedData, error: importError } = await supabase
          .from('customers')
          .upsert(validCustomers, { onConflict: 'phone' })
          .select()

        if (importError) {
          console.error('❌ Erro ao importar:', importError)
          throw importError
        }

        console.log('✅ Importação concluída!')

        await loadCustomers()

        let message = `✅ Importação concluída!\n\n`
        message += `📥 ${importedData?.length || validCustomers.length} cliente(s) importado(s)\n`

        if (customersToMarkAsPaid.length > 0) {
          message += `💰 ${customersToMarkAsPaid.length} cliente(s) marcado(s) como PAGO (não estavam na nova lista):\n`
          message += customersToMarkAsPaid.map(c => c.name).join(', ')
        }

        alert(message)
      } catch (error) {
        console.error('❌ Erro ao importar CSV:', error)
        alert(`Erro ao importar CSV: ${error.message}`)
      } finally {
        setLoading(false)
        e.target.value = ''
      }
    }

    reader.onerror = (error) => {
      console.error('❌ Erro ao ler arquivo:', error)
      alert('Erro ao ler o arquivo CSV')
    }

    console.log('🔄 Iniciando leitura do arquivo...')
    reader.readAsText(file, 'ISO-8859-1')
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

  const hasExtraData = (customer) => {
    return customer.vehicle_plate || customer.vehicle_chassis ||
           customer.vehicle_brand || customer.vehicle_model ||
           customer.document || customer.contract_status ||
           customer.seller || customer.tracker_id ||
           (customer.raw_data && Object.keys(customer.raw_data).length > 0)
  }

  const renderExpandedDetails = (customer) => {
    if (expandedRow !== customer.id) return null

    return (
      <tr className="expanded-row">
        <td colSpan="7">
          <div className="expanded-content">
            <div className="details-grid">
              {customer.document && (
                <div className="detail-item">
                  <strong>CPF/CNPJ:</strong> {customer.document}
                </div>
              )}
              {customer.vehicle_plate && (
                <div className="detail-item">
                  <strong>Placa:</strong> {customer.vehicle_plate}
                </div>
              )}
              {customer.vehicle_chassis && (
                <div className="detail-item">
                  <strong>Chassi:</strong> {customer.vehicle_chassis}
                </div>
              )}
              {customer.vehicle_brand && (
                <div className="detail-item">
                  <strong>Marca:</strong> {customer.vehicle_brand}
                </div>
              )}
              {customer.vehicle_model && (
                <div className="detail-item">
                  <strong>Modelo:</strong> {customer.vehicle_model}
                </div>
              )}
              {customer.contract_status && (
                <div className="detail-item">
                  <strong>Status Contrato:</strong> {customer.contract_status}
                </div>
              )}
              {customer.overdue_installments > 0 && (
                <div className="detail-item">
                  <strong>Parcelas Vencidas:</strong> {customer.overdue_installments}
                </div>
              )}
              {customer.tracker_id && (
                <div className="detail-item">
                  <strong>Rastreador ID:</strong> {customer.tracker_id}
                </div>
              )}
              {customer.seller && (
                <div className="detail-item">
                  <strong>Vendedor:</strong> {customer.seller}
                </div>
              )}
              {customer.installation_date && (
                <div className="detail-item">
                  <strong>Data Instalação:</strong> {new Date(customer.installation_date).toLocaleDateString('pt-BR')}
                </div>
              )}
              {customer.validity_date && (
                <div className="detail-item">
                  <strong>Data Vigência:</strong> {new Date(customer.validity_date).toLocaleDateString('pt-BR')}
                </div>
              )}
              {customer.installment_value && (
                <div className="detail-item">
                  <strong>Valor Parcela:</strong> R$ {parseFloat(customer.installment_value).toFixed(2)}
                </div>
              )}
              {customer.total_value && (
                <div className="detail-item">
                  <strong>Valor Total:</strong> R$ {parseFloat(customer.total_value).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="customers-tab">
      <div className="customers-header">
        <h2>Clientes</h2>
        <div className="customers-actions">
          <label className={`btn btn-secondary ${loading ? 'disabled' : ''}`}>
            {loading ? '⏳ Importando...' : '📥 Importar CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
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
                  <th style={{width: '40px'}}></th>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Valor Devido</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th style={{width: '100px'}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <>
                    <tr key={customer.id} className={expandedRow === customer.id ? 'expanded' : ''}>
                      <td>
                        {hasExtraData(customer) && (
                          <button
                            className="btn-icon expand-btn"
                            onClick={() => setExpandedRow(expandedRow === customer.id ? null : customer.id)}
                            title={expandedRow === customer.id ? 'Recolher' : 'Ver mais detalhes'}
                          >
                            {expandedRow === customer.id ? '▼' : '▶'}
                          </button>
                        )}
                      </td>
                      <td>
                        {customer.name}
                        {customer.vehicle_plate && (
                          <div className="table-subtitle">{customer.vehicle_plate}</div>
                        )}
                      </td>
                      <td className="phone-cell">{customer.phone}</td>
                      <td className="amount-cell">R$ {parseFloat(customer.amount_due).toFixed(2)}</td>
                      <td>{customer.due_date ? new Date(customer.due_date).toLocaleDateString('pt-BR') : '-'}</td>
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
                    {renderExpandedDetails(customer)}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="csv-instructions">
        <h3>📋 Formatos de CSV Aceitos</h3>

        <div className="format-section">
          <h4>✅ Formato 1: Sistema de Rastreamento (Recomendado)</h4>
          <p>Detecta automaticamente arquivos com colunas:</p>
          <ul>
            <li><strong>Nome/Razão Social</strong> - Nome do cliente</li>
            <li><strong>Telefone Celular</strong> - Telefone (será convertido automaticamente)</li>
            <li><strong>Valor com Juros</strong> ou <strong>Valor Total</strong> - Valor devido</li>
            <li><strong>Vencimento</strong> - Data de vencimento</li>
            <li><strong>Proposta</strong> - Número da fatura</li>
            <li><strong>Parcelas vencidas</strong> - Define status automaticamente</li>
            <li><strong>Placa</strong> - Adicionado nas observações</li>
          </ul>
          <p className="format-note">💡 Pode usar <strong>vírgula</strong> ou <strong>ponto e vírgula</strong> como separador</p>
        </div>

        <div className="format-section">
          <h4>✅ Formato 2: Formato Simples</h4>
          <code>phone,name,amount_due,due_date,invoice_number,notes,status</code>
          <p>Exemplo:</p>
          <code>5511999999999@s.whatsapp.net,João Silva,150.50,2024-12-25,INV-001,Cliente antigo,pending</code>
        </div>
      </div>
    </div>
  )
}
