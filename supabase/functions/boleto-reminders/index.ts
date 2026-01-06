import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const avisaappApiKey = Deno.env.get("AVISAAPP_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + 5);

    const reminderResults = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    const collectionResults = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 1. Enviar lembretes 5 dias antes do vencimento
    const { data: remindBoletos } = await supabase
      .from("asas_boletos")
      .select(`
        *,
        customers (
          name,
          phone
        )
      `)
      .eq("status", "PENDING")
      .is("reminder_sent_at", null)
      .gte("due_date", reminderDate.toISOString().split('T')[0])
      .lte("due_date", reminderDate.toISOString().split('T')[0]);

    if (remindBoletos && remindBoletos.length > 0) {
      console.log(`Enviando ${remindBoletos.length} lembretes...`);

      for (const boleto of remindBoletos) {
        const customer = boleto.customers as any;
        if (!customer?.phone) {
          reminderResults.errors.push(`Cliente ${customer?.name || 'desconhecido'} sem telefone`);
          reminderResults.failed++;
          continue;
        }

        const phone = customer.phone.replace(/\D/g, '');
        if (phone.length < 10) {
          reminderResults.errors.push(`Telefone inválido para ${customer.name}`);
          reminderResults.failed++;
          continue;
        }

        const dueDate = new Date(boleto.due_date);
        const formattedDate = dueDate.toLocaleDateString('pt-BR');
        const value = parseFloat(boleto.value).toFixed(2);

        const message = `Olá ${customer.name}! 📅\n\nLembrete: Seu boleto de R$ ${value} vence em 5 dias (${formattedDate}).\n\n🔗 Link do boleto: ${boleto.bank_slip_url}\n\nEvite multa e juros pagando em dia!`;

        try {
          // Buscar conexão do WhatsApp
          const { data: connections } = await supabase
            .from("whatsapp_connections")
            .select("phone_number")
            .eq("status", "connected")
            .limit(1);

          if (!connections || connections.length === 0) {
            reminderResults.errors.push("Nenhuma conexão WhatsApp ativa");
            reminderResults.failed++;
            continue;
          }

          const fromPhone = connections[0].phone_number;

          const avisaappResponse = await fetch("https://api.avisaapp.com/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": avisaappApiKey,
            },
            body: JSON.stringify({
              from: fromPhone,
              to: phone,
              message: message,
            }),
          });

          if (avisaappResponse.ok) {
            await supabase
              .from("asas_boletos")
              .update({ reminder_sent_at: new Date().toISOString() })
              .eq("id", boleto.id);

            reminderResults.sent++;
            console.log(`✓ Lembrete enviado para ${customer.name}`);
          } else {
            const errorData = await avisaappResponse.json();
            reminderResults.errors.push(`${customer.name}: ${errorData.error || 'Erro desconhecido'}`);
            reminderResults.failed++;
          }
        } catch (error) {
          reminderResults.errors.push(`${customer.name}: ${error.message}`);
          reminderResults.failed++;
        }
      }
    }

    // 2. Enviar cobranças de 3 em 3 dias após vencimento
    const { data: overdueBoletos } = await supabase
      .from("asas_boletos")
      .select(`
        *,
        customers (
          name,
          phone
        )
      `)
      .in("status", ["PENDING", "OVERDUE"])
      .lt("due_date", today.toISOString().split('T')[0]);

    if (overdueBoletos && overdueBoletos.length > 0) {
      console.log(`Verificando ${overdueBoletos.length} boletos vencidos...`);

      for (const boleto of overdueBoletos) {
        const dueDate = new Date(boleto.due_date);
        const daysSincedue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        const lastSent = boleto.last_collection_sent_at ? new Date(boleto.last_collection_sent_at) : null;
        const daysSinceLastSent = lastSent
          ? Math.floor((today.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSincedue < 1 || daysSinceLastSent < 3) {
          continue;
        }

        const customer = boleto.customers as any;
        if (!customer?.phone) {
          collectionResults.errors.push(`Cliente ${customer?.name || 'desconhecido'} sem telefone`);
          collectionResults.failed++;
          continue;
        }

        const phone = customer.phone.replace(/\D/g, '');
        if (phone.length < 10) {
          collectionResults.errors.push(`Telefone inválido para ${customer.name}`);
          collectionResults.failed++;
          continue;
        }

        const formattedDate = dueDate.toLocaleDateString('pt-BR');
        const value = parseFloat(boleto.value).toFixed(2);

        const message = `Olá ${customer.name}! ⚠️\n\nSeu boleto de R$ ${value} venceu em ${formattedDate} (${daysSincedue} dias atrás).\n\n⚡ ATENÇÃO: Juros de 10% + multa de 2% foram aplicados!\n\n🔗 Link do boleto: ${boleto.bank_slip_url}\n\nPor favor, regularize sua situação o quanto antes.`;

        try {
          const { data: connections } = await supabase
            .from("whatsapp_connections")
            .select("phone_number")
            .eq("status", "connected")
            .limit(1);

          if (!connections || connections.length === 0) {
            collectionResults.errors.push("Nenhuma conexão WhatsApp ativa");
            collectionResults.failed++;
            continue;
          }

          const fromPhone = connections[0].phone_number;

          const avisaappResponse = await fetch("https://api.avisaapp.com/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": avisaappApiKey,
            },
            body: JSON.stringify({
              from: fromPhone,
              to: phone,
              message: message,
            }),
          });

          if (avisaappResponse.ok) {
            await supabase
              .from("asas_boletos")
              .update({
                last_collection_sent_at: new Date().toISOString(),
                collection_count: (boleto.collection_count || 0) + 1,
              })
              .eq("id", boleto.id);

            collectionResults.sent++;
            console.log(`✓ Cobrança enviada para ${customer.name}`);
          } else {
            const errorData = await avisaappResponse.json();
            collectionResults.errors.push(`${customer.name}: ${errorData.error || 'Erro desconhecido'}`);
            collectionResults.failed++;
          }
        } catch (error) {
          collectionResults.errors.push(`${customer.name}: ${error.message}`);
          collectionResults.failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders: reminderResults,
        collections: collectionResults,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
