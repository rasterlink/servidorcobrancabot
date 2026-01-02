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
    const avisaappToken = Deno.env.get('AVISAAPP_TOKEN')
    const avisaappApiUrl = Deno.env.get('AVISAAPP_API_URL')

    if (!avisaappToken || !avisaappApiUrl) {
      throw new Error('AvisaApp credentials not configured')
    }

    const { phone, message }: SendMessageRequest = await req.json()

    if (!phone || !message) {
      throw new Error('Phone and message are required')
    }

    const cleanPhone = phone.replace(/\D/g, '')

    const response = await fetch(`${avisaappApiUrl}/actions/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${avisaappToken}`,
      },
      body: JSON.stringify({
        number: cleanPhone,
        mensagem: message,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AvisaApp API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

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