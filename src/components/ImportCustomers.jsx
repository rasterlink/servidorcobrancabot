import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './ImportCustomers.css';

export default function ImportCustomers() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';').map(h => h.trim());
    const customers = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length < headers.length || !values[1]?.trim()) continue;

      const customer = {};
      headers.forEach((header, index) => {
        customer[header] = values[index]?.trim() || '';
      });

      if (customer['CNPJ/CPF'] && customer['Nome/Razão Social']) {
        const proposalNumber = customer['Proposta'] || '';
        customers.push({
          cpf_cnpj: customer['CNPJ/CPF'].replace(/\D/g, ''),
          name: customer['Nome/Razão Social'],
          phone: customer['Telefone Celular']?.replace(/\D/g, '') || '',
          proposal_number: proposalNumber,
          contract_number: customer['Contrato'] || proposalNumber,
          vehicle_plate: customer['Placa'] || '',
          vehicle_chassi: customer['Chassi'] || '',
          vehicle_brand: customer['Marca'] || '',
          vehicle_model: customer['Modelo'] || '',
          installment_value: parseFloat(customer['VALOR DA PARCELA']?.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
          total_value: parseFloat(customer['VALOR TOTAL']?.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
          installments_count: parseInt(customer['QUANTIDADE DE PARCELA']) || 0,
          due_date: customer['Vencimento'] || ''
        });
      }
    }

    return customers;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setError('');
    setResults(null);

    try {
      const text = await file.text();
      const customers = parseCSV(text);

      if (customers.length === 0) {
        throw new Error('Nenhum cliente válido encontrado na planilha');
      }

      const { data, error: functionError } = await supabase.functions.invoke('asas-import-customers', {
        body: { customers }
      });

      if (functionError) throw functionError;

      setResults(data);
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Erro ao importar planilha');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="import-customers">
      <div className="import-header">
        <h1>Importar Clientes</h1>
        <p>Importe clientes da planilha e cadastre automaticamente no Asas</p>
      </div>

      <div className="import-card">
        <div className="upload-area">
          <Upload size={48} />
          <h3>Selecione a planilha CSV</h3>
          <p>Formato esperado: planilha com colunas de proposta, cliente, veículo e parcelas</p>

          <label className="upload-button">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
            />
            {importing ? 'Importando...' : 'Selecionar Arquivo'}
          </label>
        </div>

        {importing && (
          <div className="import-status">
            <Loader className="spinner" size={24} />
            <p>Processando clientes e cadastrando no Asas...</p>
          </div>
        )}

        {error && (
          <div className="import-error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="import-results">
            <div className="results-header">
              <CheckCircle size={24} />
              <h3>Importação Concluída</h3>
            </div>

            <div className="results-stats">
              <div className="stat-card success">
                <span className="stat-value">{results.success}</span>
                <span className="stat-label">Cadastrados com sucesso</span>
              </div>
              <div className="stat-card error">
                <span className="stat-value">{results.failed}</span>
                <span className="stat-label">Falharam</span>
              </div>
              <div className="stat-card total">
                <span className="stat-value">{results.total}</span>
                <span className="stat-label">Total processados</span>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="error-list">
                <h4>Erros encontrados:</h4>
                <ul>
                  {results.errors.map((err, idx) => (
                    <li key={idx}>
                      <strong>{err.customer}:</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="import-instructions">
        <h3>Instruções</h3>
        <ol>
          <li>Exporte a planilha de clientes em formato CSV</li>
          <li>Certifique-se de que contém as colunas: Proposta, CNPJ/CPF, Nome/Razão Social, Placa, Chassi, Marca, Modelo, Vencimento, Valor da Parcela, Valor Total e Quantidade de Parcelas</li>
          <li>Clique em "Selecionar Arquivo" e escolha o arquivo CSV</li>
          <li>Aguarde o processamento - os clientes serão cadastrados no Asas automaticamente</li>
          <li>A observação incluirá: número do contrato, proposta, placa, chassi, marca e modelo do veículo</li>
        </ol>
      </div>
    </div>
  );
}
