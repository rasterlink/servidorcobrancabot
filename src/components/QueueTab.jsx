import { useState, useEffect } from 'react'
import './QueueTab.css'

function QueueTab({ supabase, apiUrl }) {
  const [queueGroups, setQueueGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [selectedGroup, setSelectedGroup] = useState(null)

  useEffect(() => {
    loadQueueGroups()
  }, [])

  const loadQueueGroups = async () => {
    if (!supabase) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('overdue_installments, phone, name, amount_due, status')
        .gt('overdue_installments', 0)
        .order('overdue_installments', { ascending: true })

      if (error) throw error

      const grouped = data.reduce((acc, customer) => {
        const installments = customer.overdue_installments
        if (!acc[installments]) {
          acc[installments] = []
        }
        acc[installments].push(customer)
        return acc
      }, {})

      const groups = Object.keys(grouped)
        .map(key => ({
          installments: parseInt(key),
          count: grouped[key].length,
          customers: grouped[key],
          totalAmount: grouped[key].reduce((sum, c) => sum + parseFloat(c.amount_due || 0), 0)
        }))
        .sort((a, b) => a.installments - b.installments)

      setQueueGroups(groups)
    } catch (error) {
      console.error('Erro ao carregar fila:', error)
      alert('Erro ao carregar fila de cobranças')
    } finally {
      setLoading(false)
    }
  }

  const sendMessages = async (group) => {
    if (!confirm(`Deseja enviar mensagens para ${group.count} cliente(s) com ${group.installments} parcela(s) em atraso?`)) {
      return
    }

    setSending(true)
    setSelectedGroup(group.installments)
    setProgress({ current: 0, total: group.count })

    let successCount = 0
    let errorCount = 0
    const errors = []

    try {
      for (let i = 0; i < group.customers.length; i++) {
        const customer = group.customers[i]

        try {
          const message = `Olá ${customer.name}! Identificamos que você possui ${group.installments} parcela(s) em atraso no valor total de R$ ${parseFloat(customer.amount_due).toFixed(2)}. Entre em contato conosco para regularizar sua situação.`

          console.log(`Enviando mensagem para ${customer.name} (${customer.phone})...`)
          console.log(`API URL: ${apiUrl}/send-message`)

          const response = await fetch(`${apiUrl}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: customer.phone,
              message: message
            })
          })

          console.log(`Status da resposta: ${response.status}`)

          // Verificar se a resposta é JSON
          const contentType = response.headers.get('content-type')
          console.log(`Content-Type: ${contentType}`)

          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text()
            console.error(`Resposta não é JSON:`, text.substring(0, 200))
            errorCount++
            errors.push(`${customer.name}: Servidor retornou HTML ao invés de JSON (servidor pode estar offline)`)
            continue
          }

          const result = await response.json()

          if (!response.ok) {
            console.error(`Erro ao enviar para ${customer.phone}:`, result)
            errorCount++
            errors.push(`${customer.name}: ${result.error || 'Erro desconhecido'}`)
          } else {
            console.log(`✓ Mensagem enviada para ${customer.name}`)
            successCount++
          }

          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
          console.error(`Erro ao processar cliente ${customer.phone}:`, error)
          errorCount++
          errors.push(`${customer.name}: ${error.message}`)
        }

        setProgress({ current: i + 1, total: group.count })
      }

      if (errorCount > 0) {
        alert(`Processo concluído!\n\nEnviadas: ${successCount}\nErros: ${errorCount}\n\nErros:\n${errors.join('\n')}`)
      } else {
        alert(`Mensagens enviadas com sucesso!\n\nTotal: ${successCount}`)
      }

      loadQueueGroups()

    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      alert(`Erro ao enviar mensagens: ${error.message}`)
    } finally {
      setSending(false)
      setSelectedGroup(null)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="queue-tab">
      <div className="queue-header">
        <h2>Fila de Cobranças por Parcelas</h2>
        <button onClick={loadQueueGroups} disabled={loading || sending} className="btn-refresh">
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {sending && (
        <div className="progress-bar">
          <div className="progress-info">
            Enviando mensagens: {progress.current} de {progress.total}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="queue-groups">
        {queueGroups.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum cliente com parcelas em atraso</p>
          </div>
        ) : (
          queueGroups.map(group => (
            <div key={group.installments} className="queue-group">
              <div className="group-header">
                <div className="group-info">
                  <h3>{group.installments} Parcela{group.installments > 1 ? 's' : ''}</h3>
                  <div className="group-stats">
                    <span className="stat">{group.count} cliente{group.count > 1 ? 's' : ''}</span>
                    <span className="stat">R$ {group.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => sendMessages(group)}
                  disabled={sending}
                  className="btn-send"
                >
                  {sending && selectedGroup === group.installments ? 'Enviando...' : 'Disparar'}
                </button>
              </div>

              <div className="customers-preview">
                {group.customers.slice(0, 5).map(customer => (
                  <div key={customer.phone} className="customer-preview">
                    <span className="customer-name">{customer.name}</span>
                    <span className="customer-phone">{customer.phone}</span>
                    <span className="customer-amount">R$ {parseFloat(customer.amount_due).toFixed(2)}</span>
                  </div>
                ))}
                {group.customers.length > 5 && (
                  <div className="more-customers">
                    + {group.customers.length - 5} cliente(s)
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default QueueTab
