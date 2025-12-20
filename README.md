# WhatsApp Bot com OpenAI

Bot de WhatsApp com respostas automáticas usando inteligência artificial da OpenAI.

## Funcionalidades

- Conecta com WhatsApp via QR Code
- Respostas automáticas com IA da OpenAI
- Interface web para gerenciar conversas
- Histórico de mensagens
- Teste de IA em tempo real
- Configurações personalizáveis

## Início Rápido

### 1. Instalar dependências

```bash
npm install
cd server && npm install && cd ..
```

### 2. Iniciar o servidor backend

```bash
cd server
npm start
```

O servidor vai rodar na porta 3000.

### 3. Iniciar o frontend (em outro terminal)

```bash
npm run dev
```

### 4. Conectar o WhatsApp

1. Abra o navegador no endereço que aparecer (geralmente http://localhost:5173)
2. Clique na aba "Conexão"
3. Clique em "Conectar WhatsApp"
4. Escaneie o QR Code com seu WhatsApp
5. Pronto! Seu bot está conectado

### 5. Configurar a IA

1. Vá na aba "Configurações"
2. Cole sua chave da OpenAI (https://platform.openai.com/api-keys)
3. Personalize o prompt da IA
4. Ative "respostas automáticas"
5. Clique em "Salvar"

## Deploy no Railway

Para fazer deploy no Railway (grátis e 24/7):

### 1. Conectar ao GitHub

Pressione `Ctrl+Shift+G` no bolt.new para conectar ao GitHub.

### 2. Configurar Railway

1. Acesse https://railway.app
2. Crie novo projeto
3. Conecte ao seu repositório GitHub
4. Configure **Root Directory** como `server`
5. Adicione as variáveis de ambiente:

```
SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
PORT=3000
```

### 3. Atualizar URL da API

Após o deploy, copie a URL gerada pelo Railway e atualize o `.env`:

```
VITE_API_URL=https://sua-url-do-railway.up.railway.app
```

## Guias Completos

Para instruções detalhadas, consulte:

- [docs/comece-aqui.md](docs/comece-aqui.md) - Deploy em 3 passos
- [docs/checklist-deploy.md](docs/checklist-deploy.md) - Checklist completo
- [docs/como-conectar-github.md](docs/como-conectar-github.md) - Conectar GitHub
- [docs/como-usar.md](docs/como-usar.md) - Como usar o bot

## Tecnologias

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **WhatsApp**: Baileys (WhatsApp Web API)
- **IA**: OpenAI GPT-3.5
- **Banco de Dados**: Supabase (PostgreSQL)
- **WebSocket**: WS para comunicação em tempo real

## Estrutura do Projeto

```
.
├── src/                 # Frontend React
│   ├── components/      # Componentes da interface
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Entry point
├── server/             # Backend Node.js
│   ├── index.js        # Servidor Express + Baileys
│   ├── Dockerfile      # Para deploy com Docker
│   └── package.json    # Dependências do servidor
├── docs/               # Documentação
└── scripts/            # Scripts utilitários
```

## Custos

- **Bolt.new**: Gratuito
- **Supabase**: Gratuito (até 500MB)
- **Railway**: Gratuito (500h/mês)
- **OpenAI**: ~$2-5 por 1000 mensagens

## Suporte

Se tiver problemas:

1. Verifique os logs do servidor
2. Confirme que as variáveis de ambiente estão corretas
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Consulte os guias na pasta `docs/`
