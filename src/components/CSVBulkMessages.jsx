import { useState } from 'react'
import { Send, Upload, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import './CSVBulkMessages.css'

export default function CSVBulkMessages() {
  const [csvContent, setCSVContent] = useState('')
  const [parsedData, setParsedData] = useState([])
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá {nome}!\n\nVeículo: {placa} - {marca} {modelo}\n💰 Parcela vencida: {valor_parcela}\n📅 Vencimento: {vencimento}\n\nPor favor, regularize sua situação.'
  )
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState([])
  const [filterActive, setFilterActive] = useState(true)

  const parseCSV = (content) => {
    const lines = content.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(';').map(h => h.trim())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';')
      if (values.length < headers.length) continue

      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ''
      })

      if (filterActive && row['Situação'] !== 'ATIVO') continue
      if (!row['Telefone Celular']) continue

      data.push(row)
    }

    return data
  }

  const handleCSVChange = (e) => {
    const content = e.target.value
    setCSVContent(content)
    const parsed = parseCSV(content)
    setParsedData(parsed)
    setSendResults([])
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result
      setCSVContent(content)
      const parsed = parseCSV(content)
      setParsedData(parsed)
      setSendResults([])
    }
    reader.readAsText(file, 'ISO-8859-1')
  }

  const formatMessage = (template, row) => {
    let message = template
    message = message.replace(/{nome}/g, row['Nome/Razão Social'] || '')
    message = message.replace(/{placa}/g, row['Placa'] || '')
    message = message.replace(/{marca}/g, row['Marca'] || '')
    message = message.replace(/{modelo}/g, row['Modelo'] || '')
    message = message.replace(/{valor_parcela}/g, row['VALOR DA PARCELA'] || '')
    message = message.replace(/{valor_com_juros}/g, row['VALOR COM JUROS'] || '')
    message = message.replace(/{vencimento}/g, row['Vencimento'] || '')
    message = message.replace(/{parcelas_vencidas}/g, row['Parcelas vencidas'] || '')
    return message
  }

  const sendMessages = async () => {
    if (parsedData.length === 0) {
      alert('Nenhum dado para enviar')
      return
    }

    setSending(true)
    const results = []

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i]
      const phone = row['Telefone Celular'].replace(/\D/g, '')
      const message = formatMessage(messageTemplate, row)

      results.push({
        phone: row['Telefone Celular'],
        nome: row['Nome/Razão Social'],
        placa: row['Placa'],
        status: 'sending',
        message: 'Enviando...'
      })
      setSendResults([...results])

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avisaapp-send`
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone, message })
        })

        const data = await response.json()

        if (data.success) {
          results[i] = {
            ...results[i],
            status: 'success',
            message: 'Enviado com sucesso'
          }
        } else {
          results[i] = {
            ...results[i],
            status: 'error',
            message: data.error || 'Erro ao enviar'
          }
        }
      } catch (error) {
        results[i] = {
          ...results[i],
          status: 'error',
          message: error.message
        }
      }

      setSendResults([...results])
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setSending(false)
  }

  const availableFields = [
    '{nome}', '{placa}', '{marca}', '{modelo}',
    '{valor_parcela}', '{valor_com_juros}', '{vencimento}',
    '{parcelas_vencidas}'
  ]

  return (
    <div className="csv-bulk-messages">
      <div className="page-header">
        <h1>Envio em Massa via CSV</h1>
        <p>Importe uma planilha CSV e envie mensagens personalizadas</p>
      </div>

      <div className="csv-upload-section">
        <div className="upload-area">
          <FileText size={48} />
          <h3>Importar CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="upload-btn">
            <Upload size={16} />
            Escolher Arquivo
          </label>
          <p>ou cole o conteúdo do CSV abaixo:</p>
        </div>

        <textarea
          className="csv-textarea"
          placeholder="Cole o conteúdo do CSV aqui..."
          value={csvContent}
          onChange={handleCSVChange}
          rows={6}
        />

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.checked)
              if (csvContent) {
                const parsed = parseCSV(csvContent)
                setParsedData(parsed)
                setSendResults([])
              }
            }}
          />
          Enviar apenas para contratos ATIVOS
        </label>

        {parsedData.length > 0 && (
          <div className="csv-stats">
            <CheckCircle size={20} />
            <span>{parsedData.length} registro(s) encontrado(s) para envio</span>
          </div>
        )}
      </div>

      {parsedData.length > 0 && (
        <>
          <div className="message-template-section">
            <h3>Mensagem Personalizada</h3>
            <div className="available-fields">
              <span>Campos disponíveis:</span>
              {availableFields.map(field => (
                <button
                  key={field}
                  className="field-tag"
                  onClick={() => setMessageTemplate(messageTemplate + ' ' + field)}
                >
                  {field}
                </button>
              ))}
            </div>
            <textarea
              className="message-template-textarea"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={8}
            />
          </div>

          <div className="preview-section">
            <h3>Prévia da Primeira Mensagem</h3>
            <div className="message-preview">
              {formatMessage(messageTemplate, parsedData[0])}
            </div>
          </div>

          <div className="send-section">
            <button
              className="send-all-btn"
              onClick={sendMessages}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Clock size={20} className="spinning" />
                  Enviando... ({sendResults.filter(r => r.status !== 'sending').length}/{parsedData.length})
                </>
              ) : (
                <>
                  <Send size={20} />
                  Enviar para {parsedData.length} Contato(s)
                </>
              )}
            </button>
          </div>

          {sendResults.length > 0 && (
            <div className="results-section">
              <h3>Resultado do Envio</h3>
              <div className="results-list">
                {sendResults.map((result, index) => (
                  <div key={index} className={`result-item ${result.status}`}>
                    <div className="result-icon">
                      {result.status === 'sending' && <Clock size={18} className="spinning" />}
                      {result.status === 'success' && <CheckCircle size={18} />}
                      {result.status === 'error' && <AlertCircle size={18} />}
                    </div>
                    <div className="result-info">
                      <strong>{result.nome}</strong>
                      <span>{result.placa} - {result.phone}</span>
                    </div>
                    <div className="result-status">{result.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
