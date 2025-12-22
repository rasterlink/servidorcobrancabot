# Como Usar o Sistema de Cobrança Automática

## 🚀 Sistema 100% Funcional

O sistema está completamente operacional com as seguintes funcionalidades:

### ✅ Backend (Servidor)
- **URL do Servidor**: https://cobranca-bot-server-production.up.railway.app
- Express.js + Socket.IO
- WhatsApp Web.js (conexão via QR Code)
- Integração com OpenAI (GPT-3.5 Turbo)
- Supabase para banco de dados

### ✅ Frontend (Interface)
- React + Vite
- Socket.IO Client para comunicação em tempo real
- Interface moderna e responsiva
- Múltiplas abas de gerenciamento

## 📋 Pré-requisitos

- Node.js 18 ou superior
- Conta Supabase (já configurada)
- Chave da OpenAI (você precisa configurar)
- WhatsApp (para escanear QR Code)

## 🔧 Instalação

### 1. Frontend (este projeto)
```bash
npm install
npm run build
npm run dev
```

### 2. Backend (servidor Railway)
O backend já está rodando em:
https://cobranca-bot-server-production.up.railway.app

## 📱 Como Usar

### Passo 1: Conectar WhatsApp
1. Abra a interface do sistema
2. Vá na aba **"Conexão"**
3. Clique em **"Conectar WhatsApp"**
4. Espere o QR Code aparecer (5-10 segundos)
5. Abra o WhatsApp no celular
6. Vá em **Menu > Aparelhos Conectados**
7. Clique em **"Conectar um aparelho"**
8. Escaneie o QR Code
9. Aguarde a mensagem **"WhatsApp Conectado!"**

### Passo 2: Configurar OpenAI
1. Vá na aba **"Configurações"**
2. Cole sua chave da OpenAI (formato: `sk-...`)
3. Configure o prompt do bot (exemplo fornecido)
4. Ative **"Resposta Automática"**
5. Clique em **"Salvar"**

### Passo 3: Importar Clientes
1. Vá na aba **"Clientes"**
2. Clique em **"Importar CSV"**
3. Selecione seu arquivo CSV
4. O sistema vai:
   - Importar novos clientes
   - Atualizar clientes existentes
   - Marcar como pagos quem sumiu da lista

### Passo 4: Enviar Cobranças (Fila)
1. Vá na aba **"Fila de Cobranças"**
2. Adicione clientes à fila
3. Configure mensagens personalizadas
4. Inicie o envio automático
5. Acompanhe o progresso em tempo real

### Passo 5: Gerenciar Conversas
1. Vá na aba **"Conversas"**
2. Veja todas as conversas ativas
3. Clique em uma conversa para ver histórico
4. Envie mensagens manuais
5. Pause/retome a IA para cada cliente

### Passo 6: Testar IA
1. Vá na aba **"Testar IA"**
2. Digite uma mensagem de teste
3. Veja como o bot responderia
4. Ajuste o prompt se necessário

## 🔐 Variáveis de Ambiente (.env)

```
VITE_SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_API_URL=https://cobranca-bot-server-production.up.railway.app
```

## 📊 Estrutura das Tabelas

### customers
- Dados completos dos clientes
- Valores devidos, vencimentos
- Informações de veículos
- Status de pagamento

### conversations
- Histórico de conversas
- Status da IA (pausada/ativa)
- Última mensagem

### conversation_history
- Mensagens completas
- Histórico para contexto da IA

### bot_config
- Chave OpenAI
- Prompt do bot
- Configurações gerais

## 🎯 Funcionalidades Principais

### 1. **Resposta Automática com IA**
- Bot responde automaticamente usando GPT-3.5
- Contexto completo do cliente
- Histórico de conversas
- Negociação inteligente

### 2. **Sistema de Fila**
- Envio em massa controlado
- Intervalos configuráveis
- Pausar/retomar envios
- Acompanhamento em tempo real

### 3. **Atendentes Humanos**
- Pause a IA quando necessário
- Atenda manualmente
- Histórico completo preservado
- Sistema de transferência

### 4. **Importação Inteligente**
- CSV com mapeamento automático
- Atualização de clientes existentes
- Marca como pagos automaticamente
- Validação de dados

### 5. **Dashboard em Tempo Real**
- Status do servidor
- Status do WhatsApp
- Socket.IO conectado
- Número conectado

## 🐛 Solução de Problemas

### WhatsApp não conecta
- Verifique se o servidor está online
- Tente desconectar e conectar novamente
- Limpe o cache do navegador
- Verifique sua internet

### IA não responde
1. Verifique se a chave OpenAI está configurada
2. Verifique se "Resposta Automática" está ativa
3. Veja se a IA não está pausada para aquele cliente
4. Confira os logs do servidor

### QR Code não aparece
- Aguarde 10 segundos
- Recarregue a página
- Verifique o status do servidor
- Veja o console do navegador (F12)

### Socket.IO desconectado
- Verifique sua internet
- Recarregue a página
- Verifique se o servidor está rodando
- O sistema tentará reconectar automaticamente

## 📝 Formato do CSV de Clientes

```csv
Nome,Telefone,Valor,Vencimento,Fatura,Observações,Placa,Marca,Modelo,Chassi,CPF/CNPJ,Status do Contrato,Parcelas Vencidas,ID Rastreador,Status Renovação,Renovação Contrato,Data Instalação,Data Validade,Vendedor,Valor Parcela,Valor Total
João Silva,5511999999999,150.50,2024-01-15,12345,Cliente novo,ABC1234,Toyota,Corolla,ABC123XYZ,123.456.789-00,Ativo,2,TRACK001,Pendente,2024-12-31,2023-01-10,2025-01-10,José,75.25,1505.00
```

## 🎨 Personalização

### Alterar Prompt do Bot
1. Vá em **Configurações**
2. Edite o campo **"Prompt do Sistema"**
3. Use variáveis disponíveis:
   - Nome do cliente
   - Valor devido
   - Data de vencimento
   - Informações do veículo
   - Histórico de conversas

### Adicionar Novos Campos
1. Atualize as migrations do Supabase
2. Modifique os formulários no frontend
3. Ajuste a API no backend
4. Reconstrua e faça deploy

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
npm run build
# Faça upload da pasta dist/
```

### Backend (Railway)
Já está configurado e rodando em:
https://cobranca-bot-server-production.up.railway.app

## 📞 Suporte

Sistema desenvolvido com:
- React 18
- Node.js + Express
- Socket.IO (comunicação em tempo real)
- WhatsApp Web.js
- OpenAI GPT-3.5 Turbo
- Supabase (PostgreSQL)

---

**Dica**: Mantenha sua chave OpenAI segura e nunca compartilhe no código fonte ou repositórios públicos!
