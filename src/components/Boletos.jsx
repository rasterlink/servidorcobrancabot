import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FileUp, DollarSign, Download, RefreshCw, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './Boletos.css';

export default function Boletos() {
  const [customers, setCustomers] = useState([]);
  const [boletos, setBoletos] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [formData, setFormData] = useState({
    value: '',
    dueDate: '',
    description: '',
  });

  useEffect(() => {
    loadCustomers();
    loadBoletos();
  }, []);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (!error && data) {
      setCustomers(data);
    }
  };

  const loadBoletos = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asas-boletos?action=list-boletos`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBoletos(data);
      }
    } catch (error) {
      console.error('Error loading boletos:', error);
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const handleGenerateBoletos = async () => {
    if (selectedCustomers.length === 0) {
      alert('Selecione pelo menos um cliente');
      return;
    }

    if (!formData.value || !formData.dueDate || !formData.description) {
      alert('Preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asas-boletos?action=create-boleto`;
      let successCount = 0;
      let errorCount = 0;

      for (const customerId of selectedCustomers) {
        const customer = customers.find(c => c.id === customerId);

        if (!customer) continue;

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: {
                id: customer.id,
                name: customer.name,
                cpfCnpj: customer.cpf_cnpj,
                email: customer.email,
                phone: customer.phone,
              },
              billingType: 'BOLETO',
              value: parseFloat(formData.value),
              dueDate: formData.dueDate,
              description: formData.description,
              externalReference: `INV-${Date.now()}`,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error creating boleto for ${customer.name}:`, error);
        }
      }

      alert(`Boletos gerados: ${successCount} sucesso, ${errorCount} erros`);

      setSelectedCustomers([]);
      setShowForm(false);
      setFormData({ value: '', dueDate: '', description: '' });
      loadBoletos();
    } catch (error) {
      alert('Erro ao gerar boletos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStatus = async (paymentId) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asas-boletos?action=sync-status`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      });

      if (response.ok) {
        alert('Status atualizado com sucesso');
        loadBoletos();
      }
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        return <CheckCircle size={18} className="status-icon success" />;
      case 'PENDING':
        return <Clock size={18} className="status-icon pending" />;
      case 'error':
        return <AlertCircle size={18} className="status-icon error" />;
      default:
        return <Clock size={18} className="status-icon" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado',
      'RECEIVED': 'Recebido',
      'OVERDUE': 'Vencido',
      'error': 'Erro',
    };
    return labels[status] || status;
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setShowImport(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        alert('CSV vazio ou inválido');
        setLoading(false);
        return;
      }

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setImportProgress({ current: i + 1, total: rows.length });

        try {
          const name = row.nome || row.name;
          const cpfCnpj = row.cpf_cnpj || row.cpf || row.cnpj || row.documento;
          const email = row.email;
          const phone = row.telefone || row.phone || row.fone;
          const value = parseFloat(row.valor || row.value || 0);
          const dueDate = row.vencimento || row.due_date || row.data_vencimento;
          const description = row.descricao || row.description || row.desc || 'Boleto';

          if (!name || !cpfCnpj) {
            errors.push(`Linha ${i + 2}: Nome ou CPF/CNPJ faltando`);
            errorCount++;
            continue;
          }

          if (!value || value <= 0) {
            errors.push(`Linha ${i + 2}: Valor inválido`);
            errorCount++;
            continue;
          }

          if (!dueDate) {
            errors.push(`Linha ${i + 2}: Data de vencimento faltando`);
            errorCount++;
            continue;
          }

          let customer = await supabase
            .from('customers')
            .select('*')
            .eq('cpf_cnpj', cpfCnpj)
            .maybeSingle();

          if (!customer.data) {
            const { data: newCustomer, error: createError } = await supabase
              .from('customers')
              .insert({
                name,
                cpf_cnpj: cpfCnpj,
                email,
                phone,
              })
              .select()
              .single();

            if (createError) {
              errors.push(`Linha ${i + 2}: Erro ao criar cliente - ${createError.message}`);
              errorCount++;
              continue;
            }

            customer = { data: newCustomer };
          }

          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asas-boletos?action=create-boleto`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer: {
                id: customer.data.id,
                name: customer.data.name,
                cpfCnpj: customer.data.cpf_cnpj,
                email: customer.data.email,
                phone: customer.data.phone,
              },
              billingType: 'BOLETO',
              value,
              dueDate,
              description,
              externalReference: `CSV-${Date.now()}-${i}`,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            errors.push(`Linha ${i + 2}: ${errorData.error || 'Erro ao criar boleto'}`);
            errorCount++;
          }
        } catch (error) {
          errors.push(`Linha ${i + 2}: ${error.message}`);
          errorCount++;
        }
      }

      let message = `Importação concluída!\n${successCount} boletos gerados com sucesso\n${errorCount} erros`;
      if (errors.length > 0 && errors.length <= 10) {
        message += '\n\nErros:\n' + errors.join('\n');
      } else if (errors.length > 10) {
        message += '\n\nPrimeiros 10 erros:\n' + errors.slice(0, 10).join('\n');
      }

      alert(message);

      loadCustomers();
      loadBoletos();
      setShowImport(false);
      setImportProgress({ current: 0, total: 0 });
    } catch (error) {
      alert('Erro ao processar CSV: ' + error.message);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const downloadCSVTemplate = () => {
    const template = 'nome,cpf_cnpj,email,telefone,valor,vencimento,descricao\nJoão Silva,12345678900,joao@email.com,11999999999,100.00,2024-12-31,Mensalidade';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-importacao-boletos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="boletos-container">
      <div className="boletos-header">
        <h1>Boletos Asas</h1>
        <div className="header-actions">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            style={{ display: 'none' }}
            id="csv-upload"
            disabled={loading}
          />
          <button
            className="btn-secondary"
            onClick={downloadCSVTemplate}
            disabled={loading}
          >
            <Download size={20} />
            Baixar Modelo CSV
          </button>
          <label htmlFor="csv-upload">
            <button
              className="btn-secondary"
              onClick={() => document.getElementById('csv-upload').click()}
              disabled={loading}
              type="button"
            >
              <FileUp size={20} />
              Importar CSV
            </button>
          </label>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            <DollarSign size={20} />
            Gerar Boletos
          </button>
        </div>
      </div>

      {showImport && (
        <div className="import-progress">
          <h3>Importando CSV...</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            ></div>
          </div>
          <p>{importProgress.current} de {importProgress.total} processados</p>
        </div>
      )}

      {showForm && (
        <div className="boletos-form-section">
          <h2>Selecionar Clientes e Gerar Boletos</h2>

          <div className="form-group">
            <label>Valor do Boleto (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="100.00"
            />
          </div>

          <div className="form-group">
            <label>Data de Vencimento</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pagamento de mensalidade"
            />
          </div>

          <div className="customers-selection">
            <div className="selection-header">
              <h3>Clientes ({selectedCustomers.length} selecionados)</h3>
              <button
                className="btn-secondary"
                onClick={handleSelectAll}
              >
                {selectedCustomers.length === customers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="customers-list">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  className={`customer-item ${selectedCustomers.includes(customer.id) ? 'selected' : ''}`}
                  onClick={() => handleSelectCustomer(customer.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => {}}
                  />
                  <div className="customer-info">
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-details">
                      {customer.cpf_cnpj && <span>CPF/CNPJ: {customer.cpf_cnpj}</span>}
                      {customer.email && <span>{customer.email}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={handleGenerateBoletos}
              disabled={loading || selectedCustomers.length === 0}
            >
              {loading ? 'Gerando...' : `Gerar ${selectedCustomers.length} Boleto(s)`}
            </button>
          </div>
        </div>
      )}

      <div className="boletos-list-section">
        <div className="section-header">
          <h2>Boletos Gerados ({boletos.length})</h2>
          <button
            className="btn-secondary"
            onClick={loadBoletos}
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div className="boletos-table-wrapper">
          <table className="boletos-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {boletos.map(boleto => (
                <tr key={boleto.id}>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-name">{boleto.customers?.name}</div>
                      {boleto.customers?.email && (
                        <div className="customer-email">{boleto.customers.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="value-cell">
                    R$ {parseFloat(boleto.value).toFixed(2)}
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {new Date(boleto.due_date).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td>{boleto.description}</td>
                  <td>
                    <div className="status-cell">
                      {getStatusIcon(boleto.status)}
                      {getStatusLabel(boleto.status)}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {boleto.bank_slip_url && (
                        <a
                          href={boleto.bank_slip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon"
                          title="Download Boleto"
                        >
                          <Download size={18} />
                        </a>
                      )}
                      {boleto.asas_payment_id && (
                        <button
                          className="btn-icon"
                          onClick={() => handleSyncStatus(boleto.asas_payment_id)}
                          title="Atualizar Status"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {boletos.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Nenhum boleto gerado ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
