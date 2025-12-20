# ✅ CHECKLIST COMPLETO PARA FAZER O DEPLOY

Siga esta lista na ordem e marque cada item conforme fizer:

---

## PARTE 1: CONECTAR AO GITHUB

- [ ] 1.1 - Abrir o bolt.new (este site onde você está agora)
- [ ] 1.2 - Pressionar `Ctrl+Shift+G` (ou clicar no botão GitHub)
- [ ] 1.3 - Fazer login no GitHub
- [ ] 1.4 - Autorizar o bolt.new
- [ ] 1.5 - Criar novo repositório (ou conectar existente)
- [ ] 1.6 - Confirmar que apareceu: "✓ Connected to GitHub"
- [ ] 1.7 - Copiar o nome do repositório (você vai precisar depois!)

**Nome do meu repositório:** `_____________________`

---

## PARTE 2: CONFIGURAR RAILWAY

- [ ] 2.1 - Abrir: https://railway.app
- [ ] 2.2 - Fazer login
- [ ] 2.3 - Entrar no projeto: **"projetorenovacao-production"**
- [ ] 2.4 - Clicar na aba **"Settings"**

### Conectar GitHub:
- [ ] 2.5 - Procurar "GitHub Repository" ou "Connect Repository"
- [ ] 2.6 - Clicar em "Connect GitHub"
- [ ] 2.7 - Selecionar o repositório que você criou no passo 1.7
- [ ] 2.8 - Confirmar conexão

### Root Directory:
- [ ] 2.9 - Procurar "Root Directory"
- [ ] 2.10 - Digitar: `server`
- [ ] 2.11 - Clicar em "Save"

### Variáveis de Ambiente:
- [ ] 2.12 - Procurar "Variables" ou "Environment Variables"
- [ ] 2.13 - Clicar em "New Variable" ou "Add Variable"

**Variável 1:**
- [ ] 2.14 - Nome: `SUPABASE_URL`
- [ ] 2.15 - Valor: `https://xrmemuqqdrlgpmfvdzfw.supabase.co`
- [ ] 2.16 - Clicar em "Add" ou "Save"

**Variável 2:**
- [ ] 2.17 - Clicar em "New Variable" novamente
- [ ] 2.18 - Nome: `SUPABASE_ANON_KEY`
- [ ] 2.19 - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybWVtdXFxZHJsZ3BtZnZkemZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODg1MTksImV4cCI6MjA4MTQ2NDUxOX0.kfnTpIY2Y48LOUTcrFEjY0Hke0LTql2_piSFUFHrsuw`
- [ ] 2.20 - Clicar em "Add" ou "Save"

---

## PARTE 3: FAZER O DEPLOY

- [ ] 3.1 - Ir na aba **"Deployments"**
- [ ] 3.2 - Clicar em "Deploy" ou "Redeploy" (ou esperar o deploy automático começar)
- [ ] 3.3 - Aguardar o build (2-3 minutos)

### Verificar Logs:
- [ ] 3.4 - Clicar em "View Logs" ou nos 3 pontinhos
- [ ] 3.5 - Ver se não tem erros vermelhos
- [ ] 3.6 - Aguardar até aparecer: "Servidor rodando na porta 3000"

---

## PARTE 4: TESTAR

- [ ] 4.1 - Copiar a URL do projeto (aparece no topo da página)
- [ ] 4.2 - Abrir a URL em uma nova aba

**Minha URL:** `_____________________`

### Verificações na Interface:
- [ ] 4.3 - A página carrega completamente (sem erro branco)
- [ ] 4.4 - Vejo o título "WhatsApp + OpenAI"
- [ ] 4.5 - Vejo os botões: Conversas, Follow-ups, Renovações, Conexão, Testar IA, Configurações
- [ ] 4.6 - Na lateral, vejo os cards coloridos (roxo, azul)

### Status da Conexão:
- [ ] 4.7 - No quadro amarelo, está escrito "Servidor: Online" com bolinha verde
- [ ] 4.8 - No quadro amarelo, está escrito "WebSocket: Conectado" com bolinha verde
- [ ] 4.9 - No quadro cinza, está "Status: Desconectado" com bolinha vermelha (isso é normal!)

---

## PARTE 5: CONECTAR WHATSAPP

- [ ] 5.1 - Clicar no botão verde "Conectar WhatsApp"
- [ ] 5.2 - Aguardar alguns segundos
- [ ] 5.3 - **O QR CODE APARECE!** (se sim, funcionou!)
- [ ] 5.4 - Pegar o celular
- [ ] 5.5 - Abrir o WhatsApp
- [ ] 5.6 - Ir em: Configurações > Aparelhos Conectados > Conectar aparelho
- [ ] 5.7 - Escanear o QR Code que apareceu na tela
- [ ] 5.8 - Aguardar confirmação
- [ ] 5.9 - Ver o status mudar para: "Status: Conectado" com bolinha verde

---

## 🎉 PARABÉNS! SE TUDO ACIMA ESTÁ ✅ SEU WHATSAPP BOT ESTÁ FUNCIONANDO!

---

## ❌ SE ALGO DEU ERRADO, ME DIGA QUAL PASSO TRAVOU:

**Travei no passo:** `_____`

**Mensagem de erro (se houver):**
```
_____________________
_____________________
```

**Print da tela (se possível):** [Cole aqui]

---

## 🔄 PRÓXIMOS PASSOS (DEPOIS QUE TUDO FUNCIONAR)

- [ ] 6.1 - Ir na aba "Configurações"
- [ ] 6.2 - Adicionar Token da OpenAI (se tiver)
- [ ] 6.3 - Configurar o prompt da IA
- [ ] 6.4 - Clicar em "Salvar Configurações"
- [ ] 6.5 - Ir na aba "Conversas"
- [ ] 6.6 - Enviar uma mensagem de teste
- [ ] 6.7 - Ver o histórico de mensagens aparecendo

---

## 📋 RESUMO DO QUE FIZEMOS

1. ✅ Conectamos o código ao GitHub
2. ✅ Conectamos o Railway ao GitHub
3. ✅ Configuramos o Root Directory como `server`
4. ✅ Adicionamos as variáveis de ambiente do Supabase
5. ✅ Fizemos o deploy
6. ✅ Testamos a conexão
7. ✅ Conectamos o WhatsApp

**AGORA seu WhatsApp Bot com IA está rodando 24/7 no Railway!**

Toda vez que você fizer uma mudança no bolt.new:
- Bolt.new → GitHub (automático)
- GitHub → Railway (automático)
- Railway → Deploy (automático)
- Em 2-3 minutos, mudança está online!

---

## 🆘 PRECISA DE AJUDA?

Me mande:
1. Em qual passo você travou
2. Print da tela
3. Mensagem de erro (se tiver)

E eu te ajudo a resolver!
