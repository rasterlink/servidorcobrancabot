# Deploy de 2 Servidores no Railway

## Você tem 2 servidores prontos:

1. **server1** (porta 3001)
2. **server2** (porta 3002)

Cada um é independente e pode conectar um WhatsApp diferente.

---

## Como fazer deploy no Railway

### SERVIDOR 1

1. Acesse: https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Conecte seu repositório GitHub
5. Na configuração:
   - **Root Directory**: `server1`
   - **Build Command**: (deixe vazio)
   - **Start Command**: `npm start`
6. Adicione as variáveis de ambiente:
   ```
   SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
   PORT=3001
   ```
7. Clique em **"Deploy"**
8. Copie a URL gerada (ex: `https://servidor1.railway.app`)

---

### SERVIDOR 2

1. No Railway, clique em **"New Project"** novamente
2. Selecione **"Deploy from GitHub repo"**
3. Conecte o MESMO repositório GitHub
4. Na configuração:
   - **Root Directory**: `server2`
   - **Build Command**: (deixe vazio)
   - **Start Command**: `npm start`
5. Adicione as variáveis de ambiente:
   ```
   SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
   PORT=3002
   ```
6. Clique em **"Deploy"**
7. Copie a URL gerada (ex: `https://servidor2.railway.app`)

---

## Configurar no Frontend

Depois do deploy, edite o arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=https://seu-servidor1.railway.app
```

Ou use o servidor2:

```env
VITE_API_URL=https://seu-servidor2.railway.app
```

---

## Testar localmente

### Servidor 1:
```bash
cd server1
npm install
npm start
```
Acesse: http://localhost:3001

### Servidor 2:
```bash
cd server2
npm install
npm start
```
Acesse: http://localhost:3002

---

## O que cada servidor faz?

Cada servidor:
- Conecta um WhatsApp independente
- Recebe/envia mensagens
- Usa o mesmo banco de dados Supabase
- Funciona de forma totalmente separada

Você pode conectar 2 WhatsApps diferentes (um em cada servidor).
