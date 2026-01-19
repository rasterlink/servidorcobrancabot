# Configuração AvisaAPI

A integração com AvisaAPI foi configurada com sucesso para envio de mensagens de WhatsApp.

## Credenciais Configuradas

As credenciais da AvisaAPI foram adicionadas ao arquivo `.env`:

- **Token**: hgcWVPKSl4hXrdzhuIllHjHFaA3i4ziOK4caUbsXO4QaEBLPOnfwqOoZe8RO
- **URL da API**: https://www.avisaapi.com.br/api
- **Endpoint**: /actions/sendMessage (sem /v2)

## Como Funciona

### 1. Edge Function
Foi criada uma Edge Function no Supabase chamada `avisaapp-send` que:
- Recebe o telefone e a mensagem
- Limpa o número de telefone (remove caracteres especiais)
- Envia a mensagem via API da AvisaAPI
- Retorna o resultado da operação

### 2. Interface de Envio
No componente de Boletos (`Invoices.jsx`):
- Ao clicar em "Enviar" em um boleto, abre um modal
- Você pode escolher enviar por Email e/ou WhatsApp
- Se escolher WhatsApp, a mensagem é enviada automaticamente via AvisaAPI
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
   - WhatsApp via AvisaAPI (envio real)
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

## Detalhes Técnicos da Integração

### API da AvisaAPI
- **Endpoint**: `https://www.avisaapi.com.br/api/actions/sendMessage`
- **Método**: POST
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer [TOKEN]`
- **Body** (campos em inglês):
  - `number`: Número do telefone (apenas dígitos)
  - `message`: Texto da mensagem

### Exemplo de Requisição
```json
{
  "number": "5511987654321",
  "message": "Sua mensagem aqui"
}
```

### Resposta de Sucesso
```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "number": "5511987654321@s.whatsapp.net",
    "message": "Sua mensagem aqui",
    "response": {
      "code": 200,
      "data": {
        "Details": "Sent",
        "Id": "3EB0ED6DA975B496C1D71A",
        "Timestamp": "2026-01-19T13:23:41.339321217Z"
      },
      "success": true
    }
  }
}
```
