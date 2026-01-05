# Guia de Deploy

Este guia explica como fazer o deploy da aplicação no Railway ou outras plataformas.

## Requisitos

- Node.js 20 ou superior
- Conta no Railway (ou plataforma similar)
- Variáveis de ambiente configuradas

## Configuração do Projeto

### Arquivos de Configuração

#### 1. nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.install]
cmds = ['rm -f .npmrc', 'npm install']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

#### 2. railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Nota**: Os comandos de build são definidos no `nixpacks.toml` para evitar duplicação.

#### 3. .gitignore
```
node_modules/
dist/
.env
.npmrc
```

**IMPORTANTE**: O arquivo `.npmrc` NÃO deve ser commitado no repositório e deve ser removido antes do build, pois pode conter configurações locais de desenvolvimento que não funcionam em produção.

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Railway (ou na plataforma escolhida):

```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica

# Asaas (opcional - para integração de boletos)
ASAAS_API_KEY=sua_chave_asaas

# AvisaApp (opcional - para envio de WhatsApp)
AVISAAPP_TOKEN=seu_token_avisaapp
AVISAAPP_API_URL=https://www.avisaapp.com.br/api
```

## Deploy no Railway

### Passo 1: Conectar Repositório

1. Acesse [Railway](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório do projeto

### Passo 2: Configurar Variáveis de Ambiente

1. No painel do projeto, clique em "Variables"
2. Adicione todas as variáveis de ambiente listadas acima
3. Clique em "Add" para cada variável

### Passo 3: Deploy Automático

O Railway detectará automaticamente:
- O arquivo `nixpacks.toml` para configuração do build
- O arquivo `railway.json` para configurações específicas
- E iniciará o deploy automaticamente

### Passo 4: Verificar o Deploy

1. Aguarde o build completar (geralmente 2-5 minutos)
2. Clique em "View Logs" para acompanhar o progresso
3. Após o deploy, clique em "View Deployment" para acessar a aplicação

## Problemas Comuns

### Erro: "Falha ao ler o diretório de origem" / "Failed to read application source directory"

**Causa**: Arquivo `.npmrc` com configurações locais que não funcionam no Railway. O arquivo contém:
```
registry=http://localhost:9092/npm-registry
https-proxy=http://localhost:9091
strict-ssl=false
```

Essas configurações tentam usar um registry npm local (localhost:9092) que não existe no servidor do Railway.

**SOLUÇÃO CRÍTICA - Siga estes passos EXATAMENTE**:

```bash
# 1. REMOVA o .npmrc do projeto (se existir)
rm -f .npmrc

# 2. Verifique se o .npmrc está no gitignore
cat .gitignore | grep npmrc
# Se não aparecer, adicione manualmente

# 3. REMOVA o .npmrc do git (se foi commitado antes)
git rm -f .npmrc 2>/dev/null || true

# 4. Verifique que o arquivo NÃO está mais trackado
git ls-files | grep npmrc
# Não deve retornar nada

# 5. Commit e push
git add .gitignore
git commit -m "fix: remove .npmrc permanentemente"
git push

# 6. No Railway, force um novo deploy
# O Railway vai detectar o push automaticamente
```

**IMPORTANTE**:
- O `.npmrc` está agora no `.gitignore` para nunca mais ser commitado
- O `nixpacks.toml` remove automaticamente qualquer `.npmrc` como proteção extra
- Se você precisa configurar registries npm, use variáveis de ambiente no Railway ao invés de `.npmrc`

### Erro: "Module not found"

**Causa**: Dependências não instaladas corretamente

**Solução**:
```bash
npm install
npm run build
```

### Erro: "Build failed"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
- Verifique se todas as variáveis começando com `VITE_` estão configuradas
- No desenvolvimento local, use arquivo `.env`
- No Railway, configure na seção "Variables"

## Build Local

Para testar o build localmente antes do deploy:

```bash
# Instalar dependências
npm install

# Build de produção
npm run build

# Testar localmente
npm start
```

O comando `npm start` executa: `vite preview --host 0.0.0.0 --port ${PORT:-3000}`

## Estrutura de Pastas Após Build

```
project/
├── dist/              # Arquivos compilados (gerado pelo build)
│   ├── index.html
│   └── assets/
├── src/               # Código fonte
├── supabase/          # Migrations e Edge Functions
├── node_modules/      # Dependências
├── .env               # Variáveis de ambiente (não commitar)
├── .gitignore
├── nixpacks.toml      # Configuração Nixpacks
├── railway.json       # Configuração Railway
├── package.json
└── vite.config.js
```

## Manutenção

### Atualizar a Aplicação

1. Faça commit das mudanças no GitHub
2. O Railway fará deploy automático

### Verificar Logs

```bash
# No Railway, acesse:
Project > Deployments > View Logs
```

### Rollback

1. No Railway, acesse "Deployments"
2. Selecione uma versão anterior
3. Clique em "Redeploy"

## Suporte

Para problemas específicos:
- **Build/Deploy**: Verifique logs no Railway
- **Banco de Dados**: Consulte documentação Supabase
- **WhatsApp**: Veja `WHATSAPP_SETUP.md`
- **AvisaApp**: Veja `AVISAAPP_CONFIG.md`

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] `.npmrc` não está commitado
- [ ] `.env` está no `.gitignore`
- [ ] Build local funciona (`npm run build`)
- [ ] Migrations do Supabase aplicadas
- [ ] Edge Functions deployadas
- [ ] Repositório conectado no Railway
- [ ] Deploy bem-sucedido
- [ ] Aplicação acessível via URL do Railway
