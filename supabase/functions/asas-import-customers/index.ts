import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Customer {
  cpf_cnpj: string;
  name: string;
  phone: string;
  proposal_number: string;
  contract_number: string;
  vehicle_plate: string;
  vehicle_chassi: string;
  vehicle_brand: string;
  vehicle_model: string;
  installment_value: number;
  total_value: number;
  installments_count: number;
  due_date: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { customers } = await req.json() as { customers: Customer[] };

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum cliente fornecido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ASAS_API_KEY = Deno.env.get("ASAS_API_KEY");
    const ASAS_API_URL = Deno.env.get("ASAS_API_URL_PROD");

    if (!ASAS_API_KEY || !ASAS_API_URL) {
      return new Response(
        JSON.stringify({ error: "Configuração do Asas não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      total: customers.length,
      errors: [] as Array<{ customer: string; error: string }>,
    };

    for (const customer of customers) {
      try {
        const customerData = {
          name: customer.name,
          cpfCnpj: customer.cpf_cnpj,
          phone: customer.phone,
          observations: `Contrato: ${customer.contract_number}\nProposta: ${customer.proposal_number}\nPlaca: ${customer.vehicle_plate}\nChassi: ${customer.vehicle_chassi}\nMarca: ${customer.vehicle_brand}\nModelo: ${customer.vehicle_model}`,
        };

        const customerResponse = await fetch(`${ASAS_API_URL}/v3/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": ASAS_API_KEY,
          },
          body: JSON.stringify(customerData),
        });

        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();

          if (errorData.errors && errorData.errors[0]?.code === "invalid_action") {
            const searchResponse = await fetch(
              `${ASAS_API_URL}/v3/customers?cpfCnpj=${customer.cpf_cnpj}`,
              {
                headers: { "access_token": ASAS_API_KEY },
              }
            );

            const searchData = await searchResponse.json();
            if (searchData.data && searchData.data.length > 0) {
              const existingCustomer = searchData.data[0];
              await createPayments(
                ASAS_API_URL,
                ASAS_API_KEY,
                existingCustomer.id,
                customer
              );
              results.success++;
              continue;
            }
          }

          throw new Error(
            errorData.errors?.[0]?.description || "Erro ao criar cliente no Asas"
          );
        }

        const createdCustomer = await customerResponse.json();

        await createPayments(
          ASAS_API_URL,
          ASAS_API_KEY,
          createdCustomer.id,
          customer
        );

        results.success++;
      } catch (error) {
        console.error(`Erro ao processar cliente ${customer.name}:`, error);
        results.failed++;
        results.errors.push({
          customer: customer.name,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar importação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function createPayments(
  apiUrl: string,
  apiKey: string,
  customerId: string,
  customer: Customer
) {
  const dueDateParts = customer.due_date.split("/");
  let dueDate = new Date();

  if (dueDateParts.length === 3) {
    dueDate = new Date(
      parseInt(dueDateParts[2]),
      parseInt(dueDateParts[1]) - 1,
      parseInt(dueDateParts[0])
    );
  }

  for (let i = 0; i < customer.installments_count; i++) {
    const installmentDate = new Date(dueDate);
    installmentDate.setMonth(installmentDate.getMonth() + i);

    const payment = {
      customer: customerId,
      billingType: "BOLETO",
      value: customer.installment_value,
      dueDate: installmentDate.toISOString().split("T")[0],
      description: `Parcela ${i + 1}/${customer.installments_count} - Proposta ${customer.proposal_number}`,
      externalReference: customer.proposal_number,
    };

    const response = await fetch(`${apiUrl}/v3/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors?.[0]?.description || "Erro ao criar cobrança no Asas"
      );
    }
  }
}
