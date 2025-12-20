# Deploy do Frontend na Vercel

## ⚡ Deploy Rápido (5 minutos)

### 1. Conectar ao GitHub

Se ainda não conectou, pressione `Ctrl+Shift+G` no Bolt.new para enviar o código ao GitHub.

### 2. Criar Conta na Vercel

1. Acesse https://vercel.com
2. Clique em "Sign Up"
3. Use sua conta do GitHub para entrar

### 3. Importar Projeto

1. No dashboard da Vercel, clique em **"Add New..."** → **"Project"**
2. Selecione o repositório do GitHub que você criou
3. Clique em **"Import"**

### 4. Configurar o Deploy

Na tela de configuração:

**Framework Preset**: Vite

**Root Directory**: `.` (deixe como está)

**Build Command**: `npm run build`

**Output Directory**: `dist`

**Environment Variables** (MUITO IMPORTANTE):

```
VITE_SUPABASE_URL=https://ntcvmemtpejyccatxudp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI
VITE_API_URL=https://cobranca-bot-server-production.up.railway.app
```

5. Clique em **"Deploy"**

### 5. Aguarde o Deploy

- O deploy leva 1-2 minutos
- Quando terminar, você verá uma mensagem de sucesso
- A Vercel vai gerar uma URL como: `https://seu-projeto.vercel.app`

### 6. Pronto!

Agora você tem:
- ✅ **Backend**: `https://cobranca-bot-server-production.up.railway.app`
- ✅ **Frontend**: `https://seu-projeto.vercel.app`

**COMPARTILHE A URL DO FRONTEND** com seus atendentes!

## 🔄 Atualizações Automáticas

Toda vez que você fizer mudanças no código:
1. Bolt.new → GitHub (automático)
2. GitHub → Vercel (automático em 1-2 minutos)
3. Seus atendentes sempre terão a versão mais recente!

## 🎯 Como os Atendentes Usam

1. Cada atendente acessa: `https://seu-projeto.vercel.app`
2. Todos veem as mesmas conversas e dados (compartilhados via Supabase)
3. Podem gerenciar conversas, ver histórico, configurar IA, etc.

## ⚠️ Problemas Comuns

### Build falhou
- Verifique se as variáveis de ambiente foram adicionadas corretamente
- Todas devem começar com `VITE_`

### Página em branco
- Limpe o cache (Ctrl+Shift+R)
- Verifique o Console do navegador (F12)
- Confirme que as variáveis de ambiente estão corretas

### Não conecta com o servidor
- Verifique se a URL do Railway está correta em `VITE_API_URL`
- NÃO coloque `/` no final da URL

## 💰 Custos

**100% GRATUITO**
- Vercel: Gratuito para uso pessoal/comercial
- Railway: 500h/mês gratuitas (suficiente para 24/7)
- Supabase: Gratuito até 500MB

## 📱 Acesso Mobile

A URL funciona perfeitamente em celulares também! Seus atendentes podem acessar de qualquer dispositivo.

## 🔐 Segurança

- Todos os dados são armazenados no Supabase (criptografado)
- Conexão HTTPS automática
- Suas chaves da OpenAI ficam seguras no banco de dados

## 🆘 Suporte

Se tiver problemas:
1. Veja os logs do deploy na Vercel
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Teste o backend diretamente: `https://cobranca-bot-server-production.up.railway.app`
