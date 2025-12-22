# 2 Servidores WhatsApp Prontos

## Servidores Criados

- **Server1**: Porta 3001
- **Server2**: Porta 3002

Cada servidor pode conectar um WhatsApp diferente.

---

## Testar Agora

### Servidor 1
```bash
curl http://localhost:3001/status
```

### Servidor 2
```bash
curl http://localhost:3002/status
```

---

## Iniciar Localmente

### Terminal 1 - Servidor 1
```bash
cd server1
npm start
```

### Terminal 2 - Servidor 2
```bash
cd server2
npm start
```

### Terminal 3 - Frontend
```bash
npm run dev
```

---

## Deploy no Railway

### SERVIDOR 1

1. Railway.app → New Project
2. Deploy from GitHub repo
3. Configurar:
   - Root Directory: `server1`
   - Start Command: `npm start`
4. Variáveis:
   ```
   SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
   PORT=3001
   ```
5. Deploy

### SERVIDOR 2

1. Railway.app → New Project
2. Deploy from GitHub repo (MESMO repo)
3. Configurar:
   - Root Directory: `server2`
   - Start Command: `npm start`
4. Variáveis:
   ```
   SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
   PORT=3002
   ```
5. Deploy

---

## Arquivos de Cada Servidor

Cada pasta server1 e server2 tem:

- `index.js` - Servidor Express + Socket.IO
- `whatsapp.js` - Integração WhatsApp
- `package.json` - Dependências
- `.env` - Configurações
- `Dockerfile` - Deploy Docker
- `railway.json` - Config Railway
- `.dockerignore` - Arquivos ignorados

---

## Endpoints

Cada servidor tem:

- `GET /status` - Status WhatsApp
- `POST /connect` - Conectar
- `POST /disconnect` - Desconectar
- `POST /send-message` - Enviar mensagem
- `GET /config` - Configurações
- `POST /config` - Salvar config
- `GET /customers` - Clientes
- `GET /conversations` - Conversas

---

## Como Funciona

1. Cada servidor roda independente
2. Cada um conecta um WhatsApp diferente
3. Ambos salvam no mesmo Supabase
4. Frontend escolhe qual servidor usar (arquivo .env)
5. Socket.IO para atualizações em tempo real

---

## Estrutura

```
project/
├── server1/
│   ├── index.js
│   ├── whatsapp.js
│   ├── package.json
│   └── .env
│
├── server2/
│   ├── index.js
│   ├── whatsapp.js
│   ├── package.json
│   └── .env
│
└── src/ (frontend)
```
