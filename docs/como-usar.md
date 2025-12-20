# Como Usar o WhatsApp Bot

## Passo 1: Instalar dependências do servidor

```bash
cd server
npm install
```

## Passo 2: Iniciar o servidor backend

```bash
cd server
npm start
```

O servidor vai rodar na porta 3000.

## Passo 3: Iniciar o frontend (em outro terminal)

```bash
npm run dev
```

O frontend vai abrir no navegador automaticamente.

## Passo 4: Conectar o WhatsApp

1. Abra o frontend no navegador
2. Clique na aba "Conexao"
3. Clique em "Conectar WhatsApp"
4. Um QR Code vai aparecer na tela
5. Abra o WhatsApp no seu celular
6. Va em Menu (3 pontinhos) → Aparelhos conectados → Conectar aparelho
7. Escaneie o QR Code que apareceu na tela
8. Pronto! O WhatsApp esta conectado

## Passo 5: Configurar a IA (opcional)

1. Clique na aba "Configuracoes"
2. Cole sua chave da OpenAI (comeca com sk-...)
3. Edite o prompt da IA como quiser
4. Clique em "Salvar Configuracoes"

Agora quando alguem te enviar mensagem, a IA vai responder automaticamente!

## Recursos

- **Conexao**: Conecta/desconecta o WhatsApp
- **Configuracoes**: Define chave da OpenAI e comportamento da IA
- **Conversas**: Veja todas as mensagens (em breve)
- **Follow-ups**: Gerenciamento de follow-ups (em breve)

## Problemas comuns

### QR Code nao aparece
- Aguarde alguns segundos
- Clique em Desconectar e tente novamente

### IA nao responde
- Verifique se voce configurou a chave da OpenAI
- Verifique se o "auto_reply" esta ativado nas configuracoes

### Servidor nao inicia
- Verifique se a porta 3000 nao esta em uso
- Rode `npm install` na pasta server
