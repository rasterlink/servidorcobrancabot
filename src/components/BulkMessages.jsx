import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Send, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import './BulkMessages.css';

const MESSAGE_TEMPLATE = `Ola {nome}! Tudo bem? Sou a Julia, consultor de cobrança de contrato R link.
Não identificamos o pagamento da sua parcela.
Contrato: {contrato}
Modelo: {veiculo}
Placa: {placa}
Chassis: {chassi}
Valor mensal: {valor}
Valor total: {valor_total}
Valor com juros: {valor_juros}
Pix: {pix}
reylink proteção veicular
Por favor enviar o comprovante para baixa.
1148585841
08002970633`;

export default function BulkMessages() {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [messages, setMessages] = useState([]);
  const [uploadedData, setUploadedData] = useState([]);
  const [sending, setSending] = useState(false);
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    loadConnections();
    loadMessages();
  }, []);

  const loadConnections = async () => {
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConnections(data);
      if (data.length > 0 && !selectedConnection) {
        setSelectedConnection(data[0].id);
      }
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('bulk_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setMessages(data);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(';').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(';');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });

      if (row['Telefone Celular']) {
        const phone = row['Telefone Celular']
          .replace(/\D/g, '')
          .replace(/^55/, '');

        if (phone.length >= 10) {
          data.push({
            nome: row['Nome/Razão Social'] || row['Nome/Raz�o Social'] || '',
            contrato: row['Proposta'] || '',
            veiculo: `${row['Marca'] || ''} ${row['Modelo'] || ''}`.trim(),
            placa: row['Placa'] || '',
            chassi: row['Chassi'] || '',
            valor: row['VALOR DA PARCELA'] || row[' VALOR DA PARCELA '] || '',
            valor_total: row['VALOR TOTAL'] || '',
            valor_juros: row['VALOR COM JUROS'] || '',
            phone: phone,
            pix: pixKey
          });
        }
      }
    }

    return data;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);
        setUploadedData(parsed);
      } catch (error) {
        alert('Erro ao processar arquivo CSV');
        console.error(error);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const formatMessage = (data) => {
    return MESSAGE_TEMPLATE
      .replace('{nome}', data.nome)
      .replace('{contrato}', data.contrato)
      .replace('{veiculo}', data.veiculo)
      .replace('{placa}', data.placa)
      .replace('{chassi}', data.chassi)
      .replace('{valor}', data.valor)
      .replace('{valor_total}', data.valor_total)
      .replace('{valor_juros}', data.valor_juros)
      .replace('{pix}', data.pix);
  };

  const saveToDatabase = async () => {
    if (!selectedConnection) {
      alert('Selecione uma conexão WhatsApp');
      return;
    }

    if (uploadedData.length === 0) {
      alert('Carregue uma planilha primeiro');
      return;
    }

    const records = uploadedData.map(data => ({
      connection_id: selectedConnection,
      name: data.nome || '',
      phone: data.phone || '',
      contrato: data.contrato || '',
      veiculo: data.veiculo || '',
      placa: data.placa || '',
      chassi: data.chassi || '',
      valor: data.valor || '',
      valor_total: data.valor_total || '',
      valor_juros: data.valor_juros || '',
      pix: data.pix || pixKey || '',
      message: formatMessage(data),
      status: 'pending'
    }));

    const invalidRecords = records.filter(r => !r.name || !r.phone || !r.message);
    if (invalidRecords.length > 0) {
      alert('Alguns registros estão sem nome, telefone ou mensagem. Verifique a planilha.');
      console.error('Registros inválidos:', invalidRecords);
      return;
    }

    const { data: insertedData, error } = await supabase
      .from('bulk_messages')
      .insert(records);

    if (error) {
      alert(`Erro ao salvar mensagens: ${error.message}`);
      console.error('Erro completo:', error);
      console.error('Records tentados:', records);
      return;
    }

    setUploadedData([]);
    loadMessages();
    alert(`${records.length} mensagens adicionadas à fila`);
  };

  const sendBulkMessages = async () => {
    if (!selectedConnection) {
      alert('Selecione uma conexão WhatsApp');
      return;
    }

    const pendingMessages = messages.filter(m =>
      m.status === 'pending' && m.connection_id === selectedConnection
    );

    if (pendingMessages.length === 0) {
      alert('Não há mensagens pendentes para enviar');
      return;
    }

    setSending(true);

    for (const msg of pendingMessages) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/avisaapp-send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: msg.phone,
              message: msg.message
            })
          }
        );

        if (response.ok) {
          await supabase
            .from('bulk_messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', msg.id);
        } else {
          const error = await response.text();
          await supabase
            .from('bulk_messages')
            .update({
              status: 'failed',
              error_message: error
            })
            .eq('id', msg.id);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        await supabase
          .from('bulk_messages')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('id', msg.id);
      }
    }

    setSending(false);
    loadMessages();
    alert('Envio concluído!');
  };

  const clearMessages = async (status) => {
    const { error } = await supabase
      .from('bulk_messages')
      .delete()
      .eq('status', status);

    if (!error) {
      loadMessages();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'failed':
        return <XCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon pending" />;
    }
  };

  const stats = {
    pending: messages.filter(m => m.status === 'pending').length,
    sent: messages.filter(m => m.status === 'sent').length,
    failed: messages.filter(m => m.status === 'failed').length
  };

  return (
    <div className="bulk-messages">
      <h1>Envio em Massa</h1>

      <div className="stats-grid">
        <div className="stat-card pending">
          <Clock size={24} />
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pendentes</div>
          </div>
        </div>
        <div className="stat-card success">
          <CheckCircle size={24} />
          <div>
            <div className="stat-value">{stats.sent}</div>
            <div className="stat-label">Enviadas</div>
          </div>
        </div>
        <div className="stat-card error">
          <XCircle size={24} />
          <div>
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Falhas</div>
          </div>
        </div>
      </div>

      <div className="upload-section">
        <h2>Importar Planilha</h2>

        <div className="form-group">
          <label>Conexão WhatsApp</label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
          >
            {connections.map(conn => (
              <option key={conn.id} value={conn.id}>
                {conn.name} {conn.phone_number ? `(${conn.phone_number})` : `- ${conn.status}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Chave PIX</label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Digite a chave PIX"
          />
        </div>

        <div className="upload-box">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            id="csv-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="csv-upload" className="upload-label">
            <Upload size={32} />
            <p>Clique para selecionar arquivo CSV</p>
            <small>Formato: Planilha de contratos</small>
          </label>
        </div>

        {uploadedData.length > 0 && (
          <div className="preview-section">
            <h3>Pré-visualização ({uploadedData.length} registros)</h3>
            <div className="preview-list">
              {uploadedData.slice(0, 3).map((data, index) => (
                <div key={index} className="preview-item">
                  <strong>{data.nome}</strong>
                  <span>{data.phone}</span>
                  <small>{data.contrato}</small>
                </div>
              ))}
              {uploadedData.length > 3 && (
                <p className="more-items">... e mais {uploadedData.length - 3} registros</p>
              )}
            </div>
            <button onClick={saveToDatabase} className="btn-primary">
              Adicionar à Fila
            </button>
          </div>
        )}
      </div>

      <div className="actions-section">
        <button
          onClick={sendBulkMessages}
          disabled={sending || stats.pending === 0}
          className="btn-primary"
        >
          <Send size={20} />
          {sending ? 'Enviando...' : `Enviar ${stats.pending} Mensagens`}
        </button>

        <button
          onClick={() => clearMessages('sent')}
          className="btn-secondary"
          disabled={stats.sent === 0}
        >
          <Trash2 size={20} />
          Limpar Enviadas
        </button>

        <button
          onClick={() => clearMessages('failed')}
          className="btn-secondary"
          disabled={stats.failed === 0}
        >
          <Trash2 size={20} />
          Limpar Falhas
        </button>
      </div>

      <div className="messages-list">
        <h2>Histórico de Mensagens</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Contrato</th>
                <th>Data</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(msg => (
                <tr key={msg.id}>
                  <td>{getStatusIcon(msg.status)}</td>
                  <td>{msg.name}</td>
                  <td>{msg.phone}</td>
                  <td>{msg.contrato}</td>
                  <td>{new Date(msg.created_at).toLocaleString('pt-BR')}</td>
                  <td className="error-cell">{msg.error_message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
