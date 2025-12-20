# COMECE AQUI - Deploy em 3 Passos

## Por que você está vendo erro?

O WhatsApp Baileys precisa de um servidor Node.js rodando 24/7. Não é possível rodar apenas com Edge Functions porque mantém conexão WebSocket ativa.

**Mas é FÁCIL e GRATUITO! Veja abaixo:**

---

## Passo 1: Railway (2 minutos)

1. Acesse: **https://railway.app**
2. Faça login com GitHub
3. Clique em **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione este repositório
5. **Configure Root Directory como `server`** ⚠️

## Passo 2: Variáveis (1 minuto)

No Railway, vá em **"Variables"** e cole:

```
SUPABASE_URL=https://xrmemuqqdrlgpmfvdzfw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybWVtdXFxZHJsZ3BtZnZkemZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODg1MTksImV4cCI6MjA4MTQ2NDUxOX0.kfnTpIY2Y48LOUTcrFEjY0Hke0LTql2_piSFUFHrsuw
PORT=3000
```

**Pegue sua chave OpenAI:** https://platform.openai.com/api-keys

```
OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

## Passo 3: Conectar (2 minutos)

1. Aguarde o deploy (2-3 minutos)
2. Copie a URL gerada: `https://web-production-xxxx.up.railway.app`
3. Atualize o `.env` na raiz do projeto:
   ```
   VITE_API_URL=https://web-production-xxxx.up.railway.app
   ```
4. Recarregue a página
5. Vá em "Conexão" → "Conectar WhatsApp"
6. Escaneie o QR Code com o 11954546268

---

## Pronto!

Agora quando alguém mandar mensagem para o 11954546268, a IA vai responder automaticamente!

---

## Alternativas

- **Render**: https://render.com (hiberna após 15 min)
- **Fly.io**: https://fly.io (mais técnico)
- **Docker**: Use o `Dockerfile` na pasta `server/`

---

## Arquivos importantes criados

- `server/Dockerfile` - Deploy com Docker
- `server/railway.json` - Config Railway
- `server/verify-setup.js` - Script de verificação
- `DEPLOY-FACIL.md` - Guia completo
- `README.md` - Documentação completa

---

## Problemas?

### "Servidor Offline" ainda aparece
- Limpe o cache: Ctrl+Shift+R
- Verifique se a URL no `.env` está correta (sem `/` no final)

### QR Code não aparece
- Aguarde 10 segundos
- Verifique os logs no Railway

### IA não responde
- Vá em "Configurações" e salve sua chave OpenAI novamente

---

**Custos**: Tudo grátis (Railway + Supabase). OpenAI cobra ~$2-5 por 1000 mensagens.

Sucesso!
