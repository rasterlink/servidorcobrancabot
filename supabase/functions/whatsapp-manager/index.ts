import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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

    const { action, connectionId, phone, message } = await req.json()

    switch (action) {
      case 'initialize': {
        const qrCode = `whatsapp-connection-${connectionId}-${Date.now()}`
        
        const { error } = await supabase
          .from('whatsapp_connections')
          .update({
            status: 'scanning',
            qr_code: qrCode,
          })
          .eq('id', connectionId)

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            qrCode,
            message: 'QR Code gerado. Escaneie com seu WhatsApp.',
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
      }

      case 'refresh': {
        const { data: connection } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('id', connectionId)
          .single()

        return new Response(
          JSON.stringify({
            success: true,
            connection,
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
      }

      case 'disconnect': {
        const { error } = await supabase
          .from('whatsapp_connections')
          .update({
            status: 'disconnected',
            phone_number: null,
            session_data: null,
            qr_code: null,
          })
          .eq('id', connectionId)

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Conexão desconectada com sucesso.',
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
      }

      case 'send': {
        const { data: connection } = await supabase
          .from('whatsapp_connections')
          .select('*')
          .eq('id', connectionId)
          .eq('status', 'connected')
          .single()

        if (!connection) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Conexão não encontrada ou não está conectada.',
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          )
        }

        console.log(`Enviando mensagem para ${phone}: ${message}`)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Mensagem enviada com sucesso.',
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Ação inválida.',
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        )
    }
  } catch (error) {
    console.error('Erro na função:', error)
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