import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface SendMessageRequest {
  phone: string
  message: string
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

    const { data: connection, error: dbError } = await supabase
      .from('whatsapp_connections')
      .select('session_data')
      .eq('name', 'avisaapp')
      .eq('is_active', true)
      .eq('status', 'connected')
      .maybeSingle()

    if (dbError || !connection) {
      throw new Error('AvisaApp connection not found or inactive')
    }

    const avisaappToken = connection.session_data?.token
    const avisaappApiUrl = connection.session_data?.url || 'https://www.avisaapi.com.br/api'

    if (!avisaappToken) {
      throw new Error('AvisaApp token not configured')
    }

    console.log('Token available:', !!avisaappToken)
    console.log('API URL available:', !!avisaappApiUrl)

    const { phone, message }: SendMessageRequest = await req.json()

    if (!phone || !message) {
      throw new Error('Phone and message are required')
    }

    let cleanPhone = phone.replace(/\D/g, '')

    if (!cleanPhone.startsWith('55') && cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone
    }

    const payload = {
      number: cleanPhone,
      message: message,
    }

    const fullUrl = `${avisaappApiUrl}/actions/sendMessage`
    const bodyString = JSON.stringify(payload)

    console.log('Sending message to:', cleanPhone)
    console.log('Payload:', payload)
    console.log('Body string:', bodyString)
    console.log('API URL:', fullUrl)
    console.log('Token (first 10):', avisaappToken.substring(0, 10))
    console.log('Token length:', avisaappToken.length)

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${avisaappToken}`,
      },
      body: bodyString,
    })

    const responseText = await response.text()
    console.log('Response:', response.status, responseText)
    console.log('Request body sent:', JSON.stringify(payload))

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `AvisaAPI error: ${response.status} - ${responseText}`,
          debug: {
            sentPayload: payload,
            sentBody: JSON.stringify(payload),
            apiUrl: `${avisaappApiUrl}/actions/sendMessage`,
            responseStatus: response.status,
            responseBody: responseText,
          }
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

    const result = JSON.parse(responseText)

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error sending message:', error)
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
