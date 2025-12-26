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

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*, customer:customers(name, email, phone)')
      .eq('status', 'pending')
      .eq('reference_month', currentMonth)
      .eq('reference_year', currentYear)

    if (fetchError) {
      throw fetchError
    }

    const results = []

    for (const invoice of invoices || []) {
      try {
        console.log(`Enviando boleto para ${invoice.customer.email}`)

        await supabase.from('sending_history').insert([{
          invoice_id: invoice.id,
          status: 'success',
          send_type: 'email',
        }])

        results.push({
          invoice_id: invoice.id,
          customer: invoice.customer.name,
          status: 'success',
        })
      } catch (error) {
        console.error(`Erro ao enviar boleto ${invoice.id}:`, error)
        
        await supabase.from('sending_history').insert([{
          invoice_id: invoice.id,
          status: 'failed',
          send_type: 'email',
          error_message: error.message,
        }])

        results.push({
          invoice_id: invoice.id,
          customer: invoice.customer.name,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processados ${results.length} boletos`,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
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
