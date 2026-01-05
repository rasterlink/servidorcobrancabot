import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './ImportCustomers.css';

export default function ImportCustomers() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(';').map(h => h.trim());
    const customers = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Ignora linhas completamente vazias
      if (!line) continue;

      const values = line.split(';');

      // Ignora linhas com poucos valores
      if (values.length < 3) continue;

      const customer = {};
      headers.forEach((header, index) => {
        customer[header] = values[index]?.trim() || '';
      });

      // Verifica se tem nome E CNPJ/CPF (campos obrigatórios)
      const hasName = customer['Nome/Razão Social']?.trim().length > 0;
      const hasCpfCnpj = customer['CNPJ/CPF']?.trim().length > 0;

      if (!hasName || !hasCpfCnpj) {
        console.log(`Linha ${i + 1} ignorada - Nome: "${customer['Nome/Razão Social']}", CPF/CNPJ: "${customer['CNPJ/CPF']}"`);
        continue;
      }

      const proposalNumber = customer['Proposta'] || '';

      // Parse installments count com limpeza completa
      const installmentsRaw = customer['quantidade de parcela'] || customer['quantidade de parcelas'] || '0';
      const installmentsCount = parseInt(installmentsRaw.trim().replace(/\s+/g, '')) || 0;

      // Parse installment value com limpeza completa
      const valueRaw = customer['Valor da Parcela'] || '0';
      const installmentValue = parseFloat(valueRaw.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

      console.log(`Cliente: ${customer['Nome/Razão Social']}`);
      console.log(`  Quantidade de parcelas: "${installmentsRaw}" -> ${installmentsCount}`);
      console.log(`  Valor da parcela: "${valueRaw}" -> ${installmentValue}`);

      customers.push({
        cpf_cnpj: customer['CNPJ/CPF'].replace(/\D/g, ''),
        name: customer['Nome/Razão Social'],
        email: customer['email'] || '',
        phone: customer['Telefone Celular']?.replace(/\D/g, '') || '',
        proposal_number: proposalNumber,
        contract_number: proposalNumber,
        vehicle_plate: customer['Placa'] || '',
        vehicle_chassi: customer['Chassi'] || '',
        vehicle_brand: customer['Marca'] || '',
        vehicle_model: customer['Modelo'] || '',
        installment_value: installmentValue,
        total_value: parseFloat(customer['valor total']?.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        installments_count: installmentsCount,
        due_date: customer['Vencimento'] || customer['Vencimento da primeira'] || '',
        description: customer['descricao'] || ''
      });
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
          <li>Exporte a planilha de clientes em formato CSV com separador ponto-e-vírgula (;)</li>
          <li>Certifique-se de que contém as colunas: Nome/Razão Social, CNPJ/CPF, email, Telefone Celular, Proposta, Placa, Chassi, Marca, Modelo, Valor da Parcela, quantidade de parcela, Vencimento e descricao</li>
          <li>Remova linhas vazias do arquivo antes de importar</li>
          <li>Clique em "Selecionar Arquivo" e escolha o arquivo CSV</li>
          <li>Aguarde o processamento - os clientes serão cadastrados no Asas automaticamente</li>
          <li>A observação incluirá: número do contrato, proposta, placa, chassi, marca e modelo do veículo</li>
        </ol>
      </div>
    </div>
  );
}
