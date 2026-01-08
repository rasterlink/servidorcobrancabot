import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateCustomerRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

interface CreateBoletoRequest {
  customer: {
    id: string;
    name: string;
    cpfCnpj: string;
    email?: string;
    phone?: string;
    contractNumber?: string;
    vehiclePlate?: string;
    vehicleChassis?: string;
  };
  billingType: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference?: string;
  installmentCount?: number;
  installmentNumber?: number;
}

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
    const asasApiKey = Deno.env.get("ASAS_API_KEY")!;
    const asasApiUrl = Deno.env.get("ASAS_API_URL_PROD") || "https://api.asaas.com/";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Create or update customer in Asas
    if (action === "create-customer") {
      const customerData: CreateCustomerRequest = await req.json();

      // Create customer in Asas
      const asasResponse = await fetch(`${asasApiUrl}v3/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": asasApiKey,
        },
        body: JSON.stringify(customerData),
      });

      const asasCustomer = await asasResponse.json();

      if (!asasResponse.ok) {
        throw new Error(asasCustomer.errors?.[0]?.description || "Failed to create customer in Asas");
      }

      return new Response(JSON.stringify(asasCustomer), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Create subscription (assinatura)
    if (action === "create-subscription") {
      const subscriptionData: CreateBoletoRequest = await req.json();

      // Format phone number
      let phone = subscriptionData.customer.phone || "";
      let mobilePhone = phone.replace(/\D/g, '');

      if (mobilePhone.startsWith('55') && mobilePhone.length > 11) {
        mobilePhone = mobilePhone.substring(2);
      }

      phone = mobilePhone;

      // Check if customer exists in Asas
      let asasCustomerId = null;
      const { data: existingAsasCustomer } = await supabase
        .from("asas_customers")
        .select("asas_customer_id")
        .eq("customer_id", subscriptionData.customer.id)
        .maybeSingle();

      const customerPayload = {
        name: subscriptionData.customer.name,
        cpfCnpj: subscriptionData.customer.cpfCnpj,
        email: subscriptionData.customer.email,
        phone: phone,
        mobilePhone: mobilePhone,
      };

      if (existingAsasCustomer?.asas_customer_id) {
        asasCustomerId = existingAsasCustomer.asas_customer_id;

        const asasCheckResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "access_token": asasApiKey,
          },
        });

        if (asasCheckResponse.ok) {
          const asasUpdateResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "access_token": asasApiKey,
            },
            body: JSON.stringify(customerPayload),
          });

          if (!asasUpdateResponse.ok) {
            console.error("Failed to update customer in Asas, but continuing...");
          }

          await supabase.from("asas_customers").update({
            name: subscriptionData.customer.name,
            email: subscriptionData.customer.email,
            phone: subscriptionData.customer.phone,
          }).eq("customer_id", subscriptionData.customer.id);
        } else {
          console.log("Customer was deleted in Asas, creating new one...");
          asasCustomerId = null;
        }
      }

      if (!asasCustomerId) {
        const asasCustomerResponse = await fetch(`${asasApiUrl}v3/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": asasApiKey,
          },
          body: JSON.stringify(customerPayload),
        });

        const asasCustomer = await asasCustomerResponse.json();

        if (!asasCustomerResponse.ok) {
          throw new Error(asasCustomer.errors?.[0]?.description || "Failed to create customer in Asas");
        }

        asasCustomerId = asasCustomer.id;

        // Enable WhatsApp notifications
        try {
          const notificationsResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}/notifications`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "access_token": asasApiKey,
            },
          });

          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            const notifications = notificationsData.data || [];

            for (const notification of notifications) {
              await fetch(`${asasApiUrl}v3/notifications/${notification.id}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "access_token": asasApiKey,
                },
                body: JSON.stringify({
                  enabled: true,
                  emailEnabledForCustomer: notification.emailEnabledForCustomer || false,
                  smsEnabledForCustomer: notification.smsEnabledForCustomer || false,
                  whatsappEnabledForCustomer: true,
                  phoneCallEnabledForCustomer: notification.phoneCallEnabledForCustomer || false,
                }),
              });
            }
          }
        } catch (notifError) {
          console.error("Failed to enable WhatsApp notifications, but continuing...", notifError);
        }

        if (existingAsasCustomer) {
          await supabase.from("asas_customers").update({
            asas_customer_id: asasCustomerId,
            name: subscriptionData.customer.name,
            email: subscriptionData.customer.email,
            phone: subscriptionData.customer.phone,
          }).eq("customer_id", subscriptionData.customer.id);
        } else {
          await supabase.from("asas_customers").insert({
            customer_id: subscriptionData.customer.id,
            asas_customer_id: asasCustomerId,
            cpf_cnpj: subscriptionData.customer.cpfCnpj,
            name: subscriptionData.customer.name,
            email: subscriptionData.customer.email,
            phone: subscriptionData.customer.phone,
          });
        }
      }

      // Build description with vehicle info
      let fullDescription = `${subscriptionData.description} referente ao contrato rasterlink`;

      const vehicleInfo = [];
      if (subscriptionData.customer.contractNumber) vehicleInfo.push(`Contrato: ${subscriptionData.customer.contractNumber}`);
      if (subscriptionData.customer.vehiclePlate) vehicleInfo.push(`Placa: ${subscriptionData.customer.vehiclePlate}`);
      if (subscriptionData.customer.vehicleChassis) vehicleInfo.push(`Chassi: ${subscriptionData.customer.vehicleChassis}`);

      if (vehicleInfo.length > 0) {
        fullDescription = `${fullDescription} | ${vehicleInfo.join(' | ')}`;
      }

      // Create subscription in Asas
      const totalValue = subscriptionData.value * (subscriptionData.installmentCount || 1);

      const subscriptionPayload = {
        customer: asasCustomerId,
        billingType: "BOLETO",
        value: subscriptionData.value,
        nextDueDate: subscriptionData.dueDate,
        cycle: "MONTHLY",
        description: fullDescription,
        externalReference: subscriptionData.externalReference,
        maxPayments: subscriptionData.installmentCount || null,
        discount: {
          value: 0,
          dueDateLimitDays: 0,
        },
        interest: {
          value: 10.0,
        },
        fine: {
          value: 2.0,
        },
      };

      const asasSubscriptionResponse = await fetch(`${asasApiUrl}v3/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": asasApiKey,
        },
        body: JSON.stringify(subscriptionPayload),
      });

      const asasSubscription = await asasSubscriptionResponse.json();

      if (!asasSubscriptionResponse.ok) {
        throw new Error(asasSubscription.errors?.[0]?.description || "Failed to create subscription in Asas");
      }

      // Save subscription to database
      const { data: subscription } = await supabase
        .from("asas_subscriptions")
        .insert({
          customer_id: subscriptionData.customer.id,
          asas_customer_id: asasCustomerId,
          asas_subscription_id: asasSubscription.id,
          value: subscriptionData.value,
          cycle: "MONTHLY",
          description: subscriptionData.description,
          next_due_date: subscriptionData.dueDate,
          status: asasSubscription.status,
          external_reference: subscriptionData.externalReference,
        })
        .select()
        .single();

      // Send subscription info via WhatsApp
      try {
        const { data: customer } = await supabase
          .from("customers")
          .select("phone, name")
          .eq("id", subscriptionData.customer.id)
          .single();

        if (customer?.phone) {
          const phoneNumber = customer.phone.replace(/\D/g, '');

          let message = `Olá ${customer.name}! 🔔\n\n`;
          message += `Sua assinatura foi criada com sucesso!\n\n`;
          message += `💰 Valor mensal: R$ ${subscriptionData.value.toFixed(2)}\n`;
          message += `📅 Primeiro vencimento: ${new Date(subscriptionData.dueDate).toLocaleDateString('pt-BR')}\n`;
          message += `📊 Total de parcelas: ${subscriptionData.installmentCount || 'Indeterminado'}\n\n`;
          message += `Você receberá o boleto por WhatsApp todo mês automaticamente!\n\n`;
          message += `Qualquer dúvida, estamos à disposição! 😊`;

          const avisaAppToken = Deno.env.get("AVISAAPP_TOKEN")!;
          const avisaAppUrl = Deno.env.get("AVISAAPP_API_URL")!;

          await fetch(`${avisaAppUrl}/whatsapp/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${avisaAppToken}`,
            },
            body: JSON.stringify({
              number: phoneNumber,
              message: message,
            }),
          });
        }
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp message:", whatsappError);
      }

      return new Response(JSON.stringify({ subscription, asasSubscription }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Create boleto
    if (action === "create-boleto") {
      const boletoData: CreateBoletoRequest = await req.json();

      // Format phone number (remove special characters, keep only numbers)
      let phone = boletoData.customer.phone || "";
      let mobilePhone = phone.replace(/\D/g, '');

      // Remove country code if present (Asaas uses only DDD + number)
      if (mobilePhone.startsWith('55') && mobilePhone.length > 11) {
        mobilePhone = mobilePhone.substring(2);
      }

      phone = mobilePhone;

      // Check if customer exists in Asas
      let asasCustomerId = null;
      const { data: existingAsasCustomer } = await supabase
        .from("asas_customers")
        .select("asas_customer_id")
        .eq("customer_id", boletoData.customer.id)
        .maybeSingle();

      const customerPayload = {
        name: boletoData.customer.name,
        cpfCnpj: boletoData.customer.cpfCnpj,
        email: boletoData.customer.email,
        phone: phone,
        mobilePhone: mobilePhone,
      };

      if (existingAsasCustomer?.asas_customer_id) {
        asasCustomerId = existingAsasCustomer.asas_customer_id;

        // Verify if customer still exists in Asas
        const asasCheckResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "access_token": asasApiKey,
          },
        });

        if (asasCheckResponse.ok) {
          // Customer exists, update it
          const asasUpdateResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "access_token": asasApiKey,
            },
            body: JSON.stringify(customerPayload),
          });

          if (!asasUpdateResponse.ok) {
            console.error("Failed to update customer in Asas, but continuing...");
          }

          // Update in our database too
          await supabase.from("asas_customers").update({
            name: boletoData.customer.name,
            email: boletoData.customer.email,
            phone: boletoData.customer.phone,
          }).eq("customer_id", boletoData.customer.id);
        } else {
          // Customer was deleted in Asas, create a new one
          console.log("Customer was deleted in Asas, creating new one...");
          asasCustomerId = null;
        }
      }

      if (!asasCustomerId) {
        // Create customer in Asas first
        const asasCustomerResponse = await fetch(`${asasApiUrl}v3/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": asasApiKey,
          },
          body: JSON.stringify(customerPayload),
        });

        const asasCustomer = await asasCustomerResponse.json();

        if (!asasCustomerResponse.ok) {
          throw new Error(asasCustomer.errors?.[0]?.description || "Failed to create customer in Asas");
        }

        asasCustomerId = asasCustomer.id;

        // Enable WhatsApp notifications for the new customer
        try {
          const notificationsResponse = await fetch(`${asasApiUrl}v3/customers/${asasCustomerId}/notifications`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "access_token": asasApiKey,
            },
          });

          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            const notifications = notificationsData.data || [];

            // Update all notifications to enable WhatsApp
            for (const notification of notifications) {
              await fetch(`${asasApiUrl}v3/notifications/${notification.id}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "access_token": asasApiKey,
                },
                body: JSON.stringify({
                  enabled: true,
                  emailEnabledForCustomer: notification.emailEnabledForCustomer || false,
                  smsEnabledForCustomer: notification.smsEnabledForCustomer || false,
                  whatsappEnabledForCustomer: true,
                  phoneCallEnabledForCustomer: notification.phoneCallEnabledForCustomer || false,
                }),
              });
            }
          }
        } catch (notifError) {
          console.error("Failed to enable WhatsApp notifications, but continuing...", notifError);
        }

        // Save to our database or update if exists
        if (existingAsasCustomer) {
          // Update existing record with new Asas customer ID
          await supabase.from("asas_customers").update({
            asas_customer_id: asasCustomerId,
            name: boletoData.customer.name,
            email: boletoData.customer.email,
            phone: boletoData.customer.phone,
          }).eq("customer_id", boletoData.customer.id);
        } else {
          // Insert new record
          await supabase.from("asas_customers").insert({
            customer_id: boletoData.customer.id,
            asas_customer_id: asasCustomerId,
            cpf_cnpj: boletoData.customer.cpfCnpj,
            name: boletoData.customer.name,
            email: boletoData.customer.email,
            phone: boletoData.customer.phone,
          });
        }
      }

      // Create payment (boleto) in Asas
      // Build description with vehicle info
      let fullDescription = `${boletoData.description} referente ao contrato rasterlink`;

      const vehicleInfo = [];
      if (boletoData.customer.contractNumber) vehicleInfo.push(`Contrato: ${boletoData.customer.contractNumber}`);
      if (boletoData.customer.vehiclePlate) vehicleInfo.push(`Placa: ${boletoData.customer.vehiclePlate}`);
      if (boletoData.customer.vehicleChassis) vehicleInfo.push(`Chassi: ${boletoData.customer.vehicleChassis}`);

      if (vehicleInfo.length > 0) {
        fullDescription = `${fullDescription} | ${vehicleInfo.join(' | ')}`;
      }

      const paymentPayload = {
        customer: asasCustomerId,
        billingType: boletoData.billingType,
        value: boletoData.value,
        dueDate: boletoData.dueDate,
        description: fullDescription,
        externalReference: boletoData.externalReference,
        interest: {
          value: 10.0,
        },
        fine: {
          value: 2.0,
        },
        postalService: false,
        discount: {
          value: 0,
          dueDateLimitDays: 0,
        },
      };

      const asasPaymentResponse = await fetch(`${asasApiUrl}v3/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": asasApiKey,
        },
        body: JSON.stringify(paymentPayload),
      });

      const asasPayment = await asasPaymentResponse.json();

      if (!asasPaymentResponse.ok) {
        // Save error to database
        await supabase.from("asas_boletos").insert({
          customer_id: boletoData.customer.id,
          asas_customer_id: asasCustomerId,
          value: boletoData.value,
          due_date: boletoData.dueDate,
          description: boletoData.description,
          status: "error",
          error_message: asasPayment.errors?.[0]?.description || "Failed to create payment",
          external_reference: boletoData.externalReference,
          installment_count: boletoData.installmentCount || 1,
          installment_number: boletoData.installmentNumber || 1,
        });

        throw new Error(asasPayment.errors?.[0]?.description || "Failed to create payment in Asas");
      }

      // Save boleto to database
      const { data: boleto } = await supabase
        .from("asas_boletos")
        .insert({
          customer_id: boletoData.customer.id,
          asas_customer_id: asasCustomerId,
          asas_payment_id: asasPayment.id,
          value: boletoData.value,
          due_date: boletoData.dueDate,
          description: boletoData.description,
          status: asasPayment.status,
          bank_slip_url: asasPayment.bankSlipUrl,
          barcode: asasPayment.barCode,
          nosso_numero: asasPayment.nossoNumero,
          invoice_url: asasPayment.invoiceUrl,
          external_reference: boletoData.externalReference,
          installment_count: boletoData.installmentCount || 1,
          installment_number: boletoData.installmentNumber || 1,
          pix_code: asasPayment.pixQrCodeId || null,
          reminder_enabled: true,
          reminder_interval_days: 3,
        })
        .select()
        .single();

      // Send boleto via WhatsApp automatically
      try {
        const { data: customer } = await supabase
          .from("customers")
          .select("phone, name")
          .eq("id", boletoData.customer.id)
          .single();

        if (customer?.phone) {
          const phoneNumber = customer.phone.replace(/\D/g, '');

          let message = `Olá ${customer.name}! 🔔\n\n`;
          message += `Sua cobrança está disponível:\n\n`;
          message += `💰 Valor: R$ ${boletoData.value.toFixed(2)}\n`;
          message += `📅 Vencimento: ${new Date(boletoData.dueDate).toLocaleDateString('pt-BR')}\n\n`;

          if (asasPayment.bankSlipUrl) {
            message += `🔗 Boleto: ${asasPayment.bankSlipUrl}\n\n`;
          }

          if (asasPayment.invoiceUrl) {
            message += `🧾 PIX Copia e Cola: Acesse o link do boleto para ver o código PIX\n\n`;
          }

          message += `Qualquer dúvida, estamos à disposição! 😊`;

          const avisaAppToken = Deno.env.get("AVISAAPP_TOKEN")!;
          const avisaAppUrl = Deno.env.get("AVISAAPP_API_URL")!;

          await fetch(`${avisaAppUrl}/whatsapp/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${avisaAppToken}`,
            },
            body: JSON.stringify({
              number: phoneNumber,
              message: message,
            }),
          });
        }
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp message:", whatsappError);
      }

      return new Response(JSON.stringify({ boleto, asasPayment }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // List subscriptions
    if (action === "list-subscriptions") {
      const { data: subscriptions } = await supabase
        .from("asas_subscriptions")
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            cpf_cnpj,
            contract_number,
            vehicle_plate,
            vehicle_chassis,
            vehicle_brand,
            vehicle_model
          )
        `)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify(subscriptions || []), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // List boletos
    if (action === "list-boletos") {
      const { data: boletos } = await supabase
        .from("asas_boletos")
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            cpf_cnpj,
            contract_number,
            vehicle_plate,
            vehicle_chassis,
            vehicle_brand,
            vehicle_model
          )
        `)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify(boletos || []), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Sync boleto status from Asas
    if (action === "sync-status") {
      const { paymentId } = await req.json();

      const asasResponse = await fetch(`${asasApiUrl}v3/payments/${paymentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": asasApiKey,
        },
      });

      const asasPayment = await asasResponse.json();

      if (!asasResponse.ok) {
        throw new Error("Failed to fetch payment from Asas");
      }

      // Update in database
      await supabase
        .from("asas_boletos")
        .update({
          status: asasPayment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("asas_payment_id", paymentId);

      return new Response(JSON.stringify(asasPayment), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
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
