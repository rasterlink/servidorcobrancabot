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
    installments: 1,
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

    console.log('DEBUG - formData completo:', formData);
    console.log('DEBUG - formData.installments:', formData.installments, 'tipo:', typeof formData.installments);

    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asas-boletos?action=create-boleto`;
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      const installments = parseInt(formData.installments) || 1;

      console.log('DEBUG - installments após parseInt:', installments);
      console.log('Gerando boletos:', {
        clientes: selectedCustomers.length,
        parcelas: installments,
        total: selectedCustomers.length * installments
      });

      for (const customerId of selectedCustomers) {
        const customer = customers.find(c => c.id === customerId);

        if (!customer) continue;

        for (let installment = 1; installment <= installments; installment++) {
          try {
            const installmentDate = new Date(formData.dueDate);
            installmentDate.setMonth(installmentDate.getMonth() + (installment - 1));
            const dueDate = installmentDate.toISOString().split('T')[0];

            let descriptionParts = [];
            if (customer.contract_number) descriptionParts.push(`Contrato: ${customer.contract_number}`);
            if (customer.vehicle_plate) descriptionParts.push(`Placa: ${customer.vehicle_plate}`);
            if (customer.vehicle_chassis) descriptionParts.push(`Chassi: ${customer.vehicle_chassis}`);
            descriptionParts.push(formData.description);

            let description = descriptionParts.join(' | ');
            if (installments > 1) {
              description += ` (${installment}/${installments})`;
            }

            console.log(`Criando parcela ${installment}/${installments} para ${customer.name} - Vencimento: ${dueDate}`);

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
                  contractNumber: customer.contract_number,
                  vehiclePlate: customer.vehicle_plate,
                  vehicleChassis: customer.vehicle_chassis,
                },
                billingType: 'BOLETO',
                value: parseFloat(formData.value),
                dueDate,
                description,
                externalReference: `INV-${Date.now()}-${installment}`,
                installmentCount: installments,
                installmentNumber: installment,
              }),
            });

            if (response.ok) {
              successCount++;
              console.log(`✓ Parcela ${installment}/${installments} criada para ${customer.name}`);
            } else {
              const errorData = await response.json();
              errorCount++;
              const errorMsg = `${customer.name} - Parcela ${installment}: ${errorData.error || 'Erro desconhecido'}`;
              errors.push(errorMsg);
              console.error(errorMsg);
            }
          } catch (error) {
            errorCount++;
            const errorMsg = `${customer.name} - Parcela ${installment}: ${error.message}`;
            errors.push(errorMsg);
            console.error(errorMsg, error);
          }
        }
      }

      let message = `Boletos gerados!\n✓ ${successCount} boletos criados com sucesso\n✗ ${errorCount} erros`;

      if (errors.length > 0) {
        message += '\n\n' + (errors.length > 5
          ? 'Primeiros 5 erros:\n' + errors.slice(0, 5).join('\n')
          : 'Erros:\n' + errors.join('\n'));
      }

      alert(message);

      setSelectedCustomers([]);
      setShowForm(false);
      setFormData({ value: '', dueDate: '', description: '', installments: 1 });
      loadBoletos();
    } catch (error) {
      console.error('Erro ao gerar boletos:', error);
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

  const normalizeHeader = (header) => {
    return header
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const separator = lines[0].includes(';') ? ';' : ',';
    const rawHeaders = lines[0].split(separator);
    const headers = rawHeaders.map(h => normalizeHeader(h));
    const rows = [];

    console.log('Headers detectados:', headers);

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
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

      console.log('Total de linhas para importar:', rows.length);
      console.log('Primeira linha de exemplo:', rows[0]);

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setImportProgress({ current: i + 1, total: rows.length });

        try {
          // Detecta nome com múltiplas variações
          const name = (
            row['nome/razao social'] ||
            row['nome'] ||
            row['name'] ||
            row['razao social'] ||
            row['cliente'] ||
            ''
          ).trim();

          let cpfCnpj = (
            row['cnpj/cpf'] ||
            row['cpf/cnpj'] ||
            row['cpf_cnpj'] ||
            row['cpf'] ||
            row['cnpj'] ||
            row['documento'] ||
            ''
          ).trim();
          cpfCnpj = cpfCnpj.replace(/[.\-/\s]/g, '');

          const email = row['email'] || '';
          const phone = (row['telefone celular'] || row['telefone'] || row['phone'] || row['fone'] || '').trim();
          const contractNumber = (row['proposta'] || row['numero do contrato'] || row['contrato'] || '').trim();
          const vehiclePlate = (row['placa'] || row['plate'] || '').trim();
          const vehicleChassis = (row['chassi'] || row['chassis'] || '').trim();
          const vehicleBrand = (row['marca'] || row['brand'] || '').trim();
          const vehicleModel = (row['modelo'] || row['model'] || '').trim();

          let valueStr = (row['valor da parcela'] || row['valor'] || row['value'] || '0').trim();
          valueStr = valueStr.replace(/[R$\s]/g, '').replace(',', '.');
          const value = parseFloat(valueStr);

          let dueDate = (row['vencimento'] || row['due_date'] || row['data_vencimento'] || row['vencimento da primeira'] || '').trim();
          if (dueDate && dueDate.includes('/')) {
            const parts = dueDate.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
              dueDate = `${year}-${month}-${day}`;
            }
          }

          const additionalInfo = (row['descricao'] || row['description'] || row['desc'] || '').trim();

          let installmentsStr = (row['quantidade de parcela'] || row['parcelas'] || row['installments'] || '1').trim();
          const installmentsCount = parseInt(installmentsStr) || 1;

          console.log(`Cliente: ${name}`);
          console.log(`Quantidade de parcelas: "${installmentsStr}" -> ${installmentsCount}`);
          console.log(`Valor da parcela: "${row['valor da parcela']}" -> ${value}`);
          console.log(`Vencimento: ${dueDate}`);

          let descriptionParts = [];
          if (contractNumber) descriptionParts.push(`Contrato: ${contractNumber}`);
          if (vehiclePlate) descriptionParts.push(`Placa: ${vehiclePlate}`);
          if (vehicleChassis) descriptionParts.push(`Chassi: ${vehicleChassis}`);
          if (additionalInfo) descriptionParts.push(additionalInfo);

          const baseDescription = descriptionParts.length > 0
            ? descriptionParts.join(' | ')
            : 'Mensalidade de rastreamento';

          console.log(`Linha ${i + 2}:`, { name, cpfCnpj, value, dueDate, installmentsCount, description: baseDescription, rawRow: row });

          if (!name || name.length < 2) {
            console.error(`Erro linha ${i + 2}: Nome "${name}" inválido. Dados da linha:`, row);
            errors.push(`Linha ${i + 2}: Nome inválido ou faltando (encontrado: "${name}")`);
            errorCount++;
            continue;
          }

          if (!cpfCnpj || cpfCnpj.length < 11) {
            errors.push(`Linha ${i + 2}: CPF/CNPJ inválido ou faltando (${cpfCnpj})`);
            errorCount++;
            continue;
          }

          if (!value || value <= 0 || isNaN(value)) {
            errors.push(`Linha ${i + 2}: Valor inválido (${valueStr})`);
            errorCount++;
            continue;
          }

          if (!dueDate || dueDate.length < 8) {
            errors.push(`Linha ${i + 2}: Data de vencimento inválida (${dueDate})`);
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
                contract_number: contractNumber,
                vehicle_plate: vehiclePlate,
                vehicle_chassis: vehicleChassis,
                vehicle_brand: vehicleBrand,
                vehicle_model: vehicleModel,
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

          console.log(`=== CRIANDO ${installmentsCount} PARCELA(S) PARA ${name} ===`);

          for (let installment = 1; installment <= installmentsCount; installment++) {
            const installmentDate = new Date(dueDate);
            installmentDate.setMonth(installmentDate.getMonth() + (installment - 1));
            const installmentDueDate = installmentDate.toISOString().split('T')[0];

            const description = installmentsCount > 1
              ? `${baseDescription} (${installment}/${installmentsCount})`
              : baseDescription;

            console.log(`Criando parcela ${installment}/${installmentsCount} - Vencimento: ${installmentDueDate}`);
            console.log('=== DADOS A SEREM ENVIADOS ===');
            console.log(JSON.stringify({
              customer: {
                id: customer.data.id,
                name: customer.data.name,
                cpfCnpj: customer.data.cpf_cnpj,
                email: customer.data.email,
                phone: customer.data.phone,
                contractNumber: customer.data.contract_number,
                vehiclePlate: customer.data.vehicle_plate,
                vehicleChassis: customer.data.vehicle_chassis,
              },
              billingType: 'BOLETO',
              value,
              dueDate: installmentDueDate,
              description,
              externalReference: `CSV-${Date.now()}-${i}-${installment}`,
              installmentCount: installmentsCount,
              installmentNumber: installment,
            }, null, 2));

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
                  contractNumber: customer.data.contract_number,
                  vehiclePlate: customer.data.vehicle_plate,
                  vehicleChassis: customer.data.vehicle_chassis,
                },
                billingType: 'BOLETO',
                value,
                dueDate: installmentDueDate,
                description,
                externalReference: `CSV-${Date.now()}-${i}-${installment}`,
                installmentCount: installmentsCount,
                installmentNumber: installment,
              }),
            });

            if (response.ok) {
              successCount++;
              console.log(`✓ Parcela ${installment}/${installmentsCount} criada com sucesso`);
            } else {
              const errorData = await response.json();
              errors.push(`Linha ${i + 2} - Parcela ${installment}: ${errorData.error || 'Erro ao criar boleto'}`);
              errorCount++;
              console.error(`✗ Erro na parcela ${installment}:`, errorData);
            }
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
    const template = 'Nome/Razão Social;CNPJ/CPF;email;Telefone Celular;Proposta;Placa;Chassi;Marca;Modelo;Valor da Parcela;Vencimento;quantidade de parcela;descricao\nJoão Silva;123.456.789-00;joao@email.com;(11) 99999-9999;18149;ABC1234;9C2KF4300PR007083;HONDA;ADV 150;R$ 120,00;31/12/2025;10;contrato rasterlink central 08002970633/1148585841/11967366983\nMaria Santos;987.654.321-00;maria@email.com;(11) 98888-8888;18150;XYZ5678;1HGBH41JXMN109186;YAMAHA;NMAX 160;R$ 150,00;31/12/2025;12;contrato rasterlink central 08002970633/1148585841/11967366983';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
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
            <label>Data de Vencimento (primeira parcela)</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Quantidade de Parcelas</label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.installments}
              onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
              placeholder="1"
            />
            {formData.installments > 1 && (
              <small className="form-hint">
                Serão gerados {formData.installments} boletos mensais por cliente
              </small>
            )}
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
              {loading ? 'Gerando...' : `Gerar ${selectedCustomers.length * (formData.installments || 1)} Boleto(s)`}
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
                <th>Contrato/Veículo</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Parcela</th>
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
                  <td>
                    <div className="vehicle-info">
                      {boleto.customers?.contract_number && (
                        <div><strong>Contrato:</strong> {boleto.customers.contract_number}</div>
                      )}
                      {boleto.customers?.vehicle_plate && (
                        <div><strong>Placa:</strong> {boleto.customers.vehicle_plate}</div>
                      )}
                      {boleto.customers?.vehicle_chassis && (
                        <div><strong>Chassi:</strong> {boleto.customers.vehicle_chassis}</div>
                      )}
                      {!boleto.customers?.contract_number && !boleto.customers?.vehicle_plate && !boleto.customers?.vehicle_chassis && (
                        <span>-</span>
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
                  <td>
                    <strong>{boleto.installment_number || 1}/{boleto.installment_count || 1}</strong>
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
                  <td colSpan="8" className="empty-state">
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
