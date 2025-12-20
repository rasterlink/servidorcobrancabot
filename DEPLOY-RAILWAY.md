# Deploy no Railway - Guia Rápido

## Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Código no GitHub (use Ctrl+Shift+G no bolt.new)

## Passo a Passo

### 1. Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Escolha "Deploy from GitHub repo"
4. Selecione este repositório

### 2. Configurar Root Directory

No Railway, vá em **Settings** e configure:

- **Root Directory**: `server`
- **Build Command**: (deixe vazio, usa o padrão)
- **Start Command**: `npm start`

### 3. Adicionar Variáveis de Ambiente

Ainda em **Settings**, clique em **Variables** e adicione:

```
SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
PORT=3000
```

### 4. Deploy

1. O deploy inicia automaticamente
2. Aguarde 2-3 minutos
3. Quando terminar, copie a URL gerada (algo como: `https://web-production-xxxx.up.railway.app`)

### 5. Atualizar Frontend

No arquivo `.env` da raiz do projeto, atualize:

```
VITE_API_URL=https://sua-url-do-railway.up.railway.app
```

(substitua pela URL que você copiou)

### 6. Testar

1. Recarregue a página do frontend
2. Vá na aba "Conexão"
3. Clique em "Conectar WhatsApp"
4. Escaneie o QR Code
5. Pronto! Seu bot está rodando 24/7

## Problemas Comuns

### Build falhou
- Verifique se o **Root Directory** está como `server`
- Veja os logs do build no Railway

### QR Code não aparece
- Aguarde alguns segundos
- Verifique os logs do servidor
- Tente desconectar e conectar novamente

### Status mostra "Offline"
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique se a URL no `.env` está correta
- Certifique-se que não tem `/` no final da URL

## Custos

Railway oferece:
- **Gratuito**: 500 horas/mês (suficiente para 24/7)
- **Starter**: $5/mês para uso ilimitado

## Suporte

Se tiver problemas:
1. Veja os logs no Railway (aba Deployments → View Logs)
2. Consulte a documentação completa nos arquivos `docs/`
3. Verifique se todas as variáveis de ambiente estão configuradas

## Deploy Automático

Toda vez que você fizer mudanças no código:
1. Bolt.new → GitHub (automático)
2. GitHub → Railway (automático)
3. Em 2-3 minutos, sua mudança está online!
