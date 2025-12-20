# 🚀 COMO CONECTAR AO GITHUB (MODO SUPER FÁCIL)

## PASSO A PASSO COM IMAGENS

### 1️⃣ NO BOLT.NEW

#### Opção A: Usar o Atalho do Teclado
Pressione no teclado:
- **Windows/Linux:** `Ctrl + Shift + G`
- **Mac:** `Cmd + Shift + G`

#### Opção B: Clicar no Botão
Procure no canto superior direito da tela do bolt.new:
- Botão com ícone do GitHub (cat-octocat)
- Texto: **"Conectar GitHub"** ou **"Connect to GitHub"**
- **CLIQUE NELE!**

### 2️⃣ FAZER LOGIN NO GITHUB

Uma janela vai abrir pedindo para você fazer login no GitHub:
1. Digite seu **usuário** do GitHub
2. Digite sua **senha** do GitHub
3. Clique em **"Sign in"**
4. Se pedir autenticação de 2 fatores, digite o código

### 3️⃣ AUTORIZAR O BOLT.NEW

O GitHub vai perguntar se você autoriza o bolt.new:
1. Leia as permissões (ele vai criar repositórios pra você)
2. Clique em **"Authorize"** ou **"Autorizar"**

### 4️⃣ CRIAR OU CONECTAR REPOSITÓRIO

O bolt.new vai mostrar opções:

**Opção A - Criar Novo Repositório:**
1. Digite um nome para o repositório (ex: `whatsapp-openai-bot`)
2. Escolha se quer público ou privado
3. Clique em **"Create Repository"**

**Opção B - Conectar a Repositório Existente:**
1. Selecione um repositório da lista
2. Clique em **"Connect"**

### 5️⃣ PRONTO!

O bolt.new vai:
- ✅ Criar o repositório no GitHub
- ✅ Fazer o commit inicial
- ✅ Fazer o push de todos os arquivos
- ✅ Mostrar uma mensagem de sucesso

Você verá algo como:
> "✓ Connected to GitHub: seu-usuario/whatsapp-openai-bot"

---

## AGORA CONECTE O RAILWAY AO GITHUB

### 1️⃣ ABRA O RAILWAY
Vá para: https://railway.app

### 2️⃣ ENTRE NO SEU PROJETO
Clique em: **"projetorenovacao-production"**

### 3️⃣ VÁ EM SETTINGS
Clique na aba **"Settings"** (ícone de engrenagem)

### 4️⃣ CONECTE AO GITHUB

Procure por uma dessas opções:
- **"GitHub Repository"**
- **"Connect Repository"**
- **"Source"**
- Botão **"Connect GitHub"**

Clique e:
1. Autorize o Railway a acessar o GitHub (se pedir)
2. Selecione o repositório que você criou (ex: `whatsapp-openai-bot`)
3. Clique em **"Connect"**

### 5️⃣ CONFIGURE O ROOT DIRECTORY

Na mesma tela de Settings:
1. Procure por **"Root Directory"** ou **"Source Directory"**
2. Digite: `server`
3. Clique em **"Save"** ou **"Update"**

### 6️⃣ ADICIONE AS VARIÁVEIS DE AMBIENTE

Ainda em Settings, procure por **"Variables"**:

Clique em **"New Variable"** e adicione:

**Variável 1:**
```
Nome: SUPABASE_URL
Valor: https://xrmemuqqdrlgpmfvdzfw.supabase.co
```

**Variável 2:**
```
Nome: SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybWVtdXFxZHJsZ3BtZnZkemZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODg1MTksImV4cCI6MjA4MTQ2NDUxOX0.kfnTpIY2Y48LOUTcrFEjY0Hke0LTql2_piSFUFHrsuw
```

### 7️⃣ FAÇA O DEPLOY

1. Vá na aba **"Deployments"**
2. O Railway vai detectar as mudanças automaticamente
3. Um novo deploy vai começar
4. Aguarde 2-3 minutos

### 8️⃣ TESTE!

Quando o deploy terminar:
1. Clique na URL do projeto
2. Você verá a interface funcionando!
3. Indicadores verdes de "Servidor Online" e "WebSocket Conectado"
4. Clique em "Conectar WhatsApp"
5. QR Code vai aparecer!

---

## 🎉 PRONTO! AGORA TODA VEZ QUE VOCÊ FIZER MUDANÇAS:

1. Bolt.new faz push para o GitHub automaticamente
2. Railway detecta a mudança
3. Railway faz deploy automático
4. Em 2 minutos sua mudança está online!

---

## ❓ PROBLEMAS?

### Não encontro o botão do GitHub no bolt.new
- Tente o atalho de teclado: `Ctrl+Shift+G` ou `Cmd+Shift+G`
- Atualize a página do bolt.new
- Verifique se está logado no bolt.new

### Railway não está conectando ao GitHub
- Certifique-se que você criou o repositório no passo anterior
- Tente desconectar e reconectar sua conta GitHub no Railway
- Verifique se o repositório é público (ou dê permissão ao Railway para repos privados)

### Build está falando no Railway
- Verifique se o Root Directory está como `server`
- Veja os logs do build no Railway
- Me mande uma print do erro e eu te ajudo!

### Ainda dá erro de conexão
- Aguarde o deploy terminar completamente (veja os logs)
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Tente abrir em aba anônima
- Verifique se as variáveis de ambiente foram adicionadas
