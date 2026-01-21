import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const response = await fetch(`${supabaseUrl}/functions/v1/avisaapp-send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, message }),
  })

  return await response.json()
}

function generateResponse(userMessage: string): string {
  const message = userMessage.toLowerCase().trim()

  if (message.includes('oi') || message.includes('ola') || message.includes('olá')) {
    return 'Olá! Eu sou o assistente automático. Como posso ajudar você hoje?'
  }

  if (message.includes('ajuda') || message.includes('help')) {
    return 'Estou aqui para ajudar! Você pode me perguntar sobre:\n- Faturas e boletos\n- Status de pagamentos\n- Informações de contato\n\nO que você precisa?'
  }

  if (message.includes('boleto') || message.includes('fatura')) {
    return 'Para consultar seus boletos e faturas, posso ajudá-lo! Qual o número do seu CPF/CNPJ?'
  }

  if (message.includes('pagamento')) {
    return 'Para verificar o status do seu pagamento, preciso do número do boleto ou da fatura. Você tem essa informação?'
  }

  if (message.includes('obrigado') || message.includes('obrigada') || message.includes('valeu')) {
    return 'Por nada! Estou sempre aqui para ajudar. Se precisar de algo mais, é só chamar!'
  }

  return `Recebi sua mensagem: "${userMessage}"\n\nSou um assistente automático. Como posso ajudá-lo?\n\nDigite "ajuda" para ver as opções disponíveis.`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const webhook = await req.json()

    console.log('Webhook recebido:', JSON.stringify(webhook))

    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: 'avisaapp_message',
        payload: webhook,
        received_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Erro ao salvar webhook:', error)
    }

    if (webhook.event === 'message.received' && webhook.data?.message?.text) {
      const phoneNumber = webhook.data.from?.replace('@s.whatsapp.net', '')
      const messageText = webhook.data.message.text

      console.log(`Mensagem recebida de ${phoneNumber}: ${messageText}`)

      if (phoneNumber && messageText) {
        const responseMessage = generateResponse(messageText)

        console.log(`Enviando resposta: ${responseMessage}`)

        const sendResult = await sendWhatsAppMessage(phoneNumber, responseMessage)
        console.log('Resultado do envio:', JSON.stringify(sendResult))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook recebido com sucesso',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Erro ao processar webhook:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
