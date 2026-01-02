# Configuração AvisaApp

A integração com AvisaApp foi configurada com sucesso para envio de mensagens de WhatsApp.

## Credenciais Configuradas

As credenciais da AvisaApp foram adicionadas ao arquivo `.env`:

- **Token**: EnhfQtEyxoBTURwUr0tpW3NJiGoIq5z8pb38P4sGolwOhPbgVODBcywgnr5L
- **URL da API**: https://www.avisaapp.com.br/api

## Como Funciona

### 1. Edge Function
Foi criada uma Edge Function no Supabase chamada `avisaapp-send` que:
- Recebe o telefone e a mensagem
- Limpa o número de telefone (remove caracteres especiais)
- Envia a mensagem via API da AvisaApp
- Retorna o resultado da operação

### 2. Interface de Envio
No componente de Boletos (`Invoices.jsx`):
- Ao clicar em "Enviar" em um boleto, abre um modal
- Você pode escolher enviar por Email e/ou WhatsApp
- Se escolher WhatsApp, a mensagem é enviada automaticamente via AvisaApp
- O histórico de envios é registrado na tabela `sending_history`

### 3. Formato da Mensagem
A mensagem enviada segue este formato:
```
Olá [Nome do Cliente]! Seu boleto no valor de R$ [Valor] está disponível. Vencimento: [Data]
```

## Como Usar

1. Acesse a aba "Boletos"
2. Clique no botão de enviar (ícone de envelope) ao lado de um boleto
3. Marque as opções desejadas:
   - Email (apenas log no console por enquanto)
   - WhatsApp via AvisaApp (envio real)
4. Clique em "Enviar"

## Requisitos

- O cliente precisa ter um número de telefone cadastrado
- O número pode estar em qualquer formato (será limpo automaticamente)
- Formatos aceitos: (11) 98765-4321, 11987654321, +5511987654321, etc.

## Endpoint da API

A Edge Function está disponível em:
```
https://ntcvmemtpejyccatxudp.supabase.co/functions/v1/avisaapp-send
```

Requer autenticação com o token do Supabase.
