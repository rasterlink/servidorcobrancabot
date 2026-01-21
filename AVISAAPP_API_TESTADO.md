# AvisaApp API - Configuração Testada e Funcionando

## ✅ Status: FUNCIONANDO PERFEITAMENTE

**Data de Teste:** 21/01/2026
**Mensagens de Teste Enviadas com Sucesso:** 2

## Configuração da API

### Endpoint
```
https://www.avisaapi.com.br/api/actions/sendMessage
```

### Token de Autenticação
```
zyeaHd8EppnOrsdp9ZbsKTFJtcHVLsAY5WUNrecUDKCLmcTeZNie8hifKoqv
```

### Número de Teste
```
11954546268
```

## Formato da Requisição (cURL)

```bash
curl -X POST "https://www.avisaapi.com.br/api/actions/sendMessage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zyeaHd8EppnOrsdp9ZbsKTFJtcHVLsAY5WUNrecUDKCLmcTeZNie8hifKoqv" \
  -d '{
    "number": "11954546268",
    "message": "Sua mensagem aqui"
  }'
```

## Formato da Requisição (JavaScript/Fetch)

```javascript
const response = await fetch('https://www.avisaapi.com.br/api/actions/sendMessage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer zyeaHd8EppnOrsdp9ZbsKTFJtcHVLsAY5WUNrecUDKCLmcTeZNie8hifKoqv'
  },
  body: JSON.stringify({
    number: '11954546268',
    message: 'Sua mensagem aqui'
  })
});

const result = await response.json();
```

## Resposta de Sucesso

```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "number": "5511954546268@s.whatsapp.net",
    "message": "Sua mensagem",
    "response": {
      "code": 200,
      "data": {
        "Details": "Sent",
        "Id": "3EB0DC3D4F712C0D9C787C",
        "Timestamp": "2026-01-21T12:09:43.12728146Z"
      },
      "success": true
    }
  }
}
```

## Observações Importantes

1. **Formato do Número:** A API aceita o número sem o código do país (11954546268) e adiciona automaticamente o prefixo 55 e o sufixo @s.whatsapp.net

2. **Headers Obrigatórios:**
   - Content-Type: application/json
   - Authorization: Bearer {token}

3. **Estrutura do Body:**
   - number: string (apenas números, com DDD)
   - message: string (texto da mensagem)

4. **Emojis:** Suportados normalmente (✓, ✅, etc.)

## Edge Function Atual

A Edge Function `avisaapp-send` está configurada e funcionando com essas credenciais.

Caminho: `supabase/functions/avisaapp-send/index.ts`

## Testes Realizados

1. ✅ Primeira mensagem: "Teste de envio via AvisaApp API - Funcionou!"
2. ✅ Segunda mensagem: "Segunda mensagem de teste - Confirmando funcionamento! ✓"

Ambas foram entregues com sucesso.
