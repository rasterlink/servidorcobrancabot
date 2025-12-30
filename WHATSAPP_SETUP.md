# Configuração do Sistema WhatsApp

## Visão Geral

O sistema de controle de boletos agora inclui suporte para múltiplas conexões WhatsApp, permitindo que você envie boletos diretamente para seus clientes via WhatsApp.

## Funcionalidades Implementadas

### 1. Gerenciamento de Conexões
- Adicionar múltiplas conexões WhatsApp
- Gerenciar status de cada conexão (conectado/desconectado/aguardando)
- Deletar conexões não utilizadas
- Visualização de QR codes para autenticação

### 2. Envio de Boletos
- Enviar boletos por Email
- Enviar boletos por WhatsApp
- Enviar por ambos (Email + WhatsApp)
- Escolher qual conexão WhatsApp utilizar
- Histórico de envios registrado no banco de dados

### 3. Banco de Dados
- Tabela `whatsapp_connections` para armazenar conexões
- Histórico de envios vinculado a conexões WhatsApp
- Rastreamento de status e últimas conexões

## Como Usar

### Passo 1: Adicionar uma Conexão WhatsApp

1. Acesse a seção "WhatsApp" no menu lateral
2. Clique em "Nova Conexão"
3. Digite um nome identificador (ex: "WhatsApp Vendas", "WhatsApp Suporte")
4. Clique em "Criar Conexão"
5. Um QR Code será gerado

### Passo 2: Conectar seu WhatsApp

1. Abra o WhatsApp no seu celular
2. Toque em Mais opções (⋮) no canto superior direito
3. Selecione "Aparelhos conectados"
4. Toque em "Conectar um aparelho"
5. Aponte seu celular para o QR Code na tela

### Passo 3: Enviar Boletos

1. Vá para a seção "Boletos"
2. Clique no botão de enviar (ícone de avião) ao lado do boleto desejado
3. Escolha as opções de envio:
   - Email (requer que o cliente tenha email cadastrado)
   - WhatsApp (requer que o cliente tenha telefone cadastrado)
   - Ambos
4. Se escolher WhatsApp, selecione qual conexão usar
5. Clique em "Enviar"

## Implementação de Servidor Próprio (Produção)

A implementação atual é uma estrutura base. Para um servidor próprio funcional em produção, você precisará:

### Opção 1: Usar whatsapp-web.js

Criar um servidor Node.js separado com:

```bash
npm install whatsapp-web.js qrcode-terminal
```

Características:
- Servidor WebSocket persistente
- Gerenciamento de múltiplas sessões
- Armazenamento de autenticação
- Reconexão automática

### Opção 2: Usar Baileys

Biblioteca mais leve e moderna:

```bash
npm install @whiskeysockets/baileys
```

Características:
- Menor uso de recursos
- Múltiplas instâncias simultâneas
- Melhor performance

### Opção 3: Usar Serviço de API (Recomendado para produção)

Serviços como:
- **Evolution API** (código aberto)
- **Wppconnect**
- **Z-API** (pago)
- **Maytapi** (pago)

Vantagens:
- Infraestrutura gerenciada
- Suporte oficial
- Escalável
- Sem preocupação com manutenção

## Arquitetura Recomendada

```
[App React] <--HTTP--> [Supabase Edge Functions] <--HTTP--> [Servidor WhatsApp]
                                                              (Node.js + whatsapp-web.js)
```

### Fluxo de Conexão:

1. Frontend solicita nova conexão
2. Edge Function cria registro no banco
3. Edge Function chama servidor WhatsApp para gerar QR
4. Servidor WhatsApp retorna QR code
5. Frontend exibe QR code para usuário
6. Usuário escaneia com WhatsApp
7. Servidor WhatsApp atualiza status no banco para "connected"

### Fluxo de Envio:

1. Frontend solicita envio de mensagem
2. Edge Function valida dados e conexão
3. Edge Function chama servidor WhatsApp
4. Servidor WhatsApp envia mensagem via WhatsApp Web
5. Resposta é registrada no histórico

## Segurança

- Nunca exponha credenciais do WhatsApp
- Use autenticação para APIs
- Valide todos os números de telefone
- Implemente rate limiting
- Faça backup das sessões regularmente
- Use HTTPS em todas as comunicações

## Limitações do WhatsApp

- Máximo de 4 aparelhos conectados por conta
- Não envie spam ou mensagens em massa não solicitadas
- Respeite os termos de serviço do WhatsApp
- Considere usar WhatsApp Business API para uso comercial oficial

## Próximos Passos

1. Configurar servidor Node.js com whatsapp-web.js ou Evolution API
2. Conectar edge functions ao servidor WhatsApp
3. Testar envios em ambiente de desenvolvimento
4. Configurar templates de mensagem personalizados
5. Implementar agendamento de envios automáticos
6. Adicionar relatórios de entrega

## Suporte

Para questões sobre a implementação técnica do servidor WhatsApp, consulte:
- [whatsapp-web.js Documentation](https://github.com/pedroslopez/whatsapp-web.js)
- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Evolution API](https://github.com/EvolutionAPI/evolution-api)
