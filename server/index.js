import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as whatsapp from './whatsapp.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ntcvmemtpejyccatxudp.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y3ZtZW10cGVqeWNjYXR4dWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjc1NjcsImV4cCI6MjA4MTc0MzU2N30.352bvQQuRnTI_C53nyVSWFy-8GHn5BMzdz2h3rEh7CI'
);

async function getConfig() {
  const { data } = await supabase
    .from('bot_config')
    .select('*')
    .maybeSingle();

  return data || { openai_key: '', prompt: 'Você é um assistente útil.', auto_reply: false };
}

async function handleMessage(msg) {
  try {
    const from = msg.from;
    const text = msg.body || '';

    console.log(`Mensagem de ${from}: ${text}`);

    await supabase.from('conversations').insert({
      phone: from,
      customer_phone: from,
      message: text,
      type: 'received',
      timestamp: new Date().toISOString()
    });

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', from)
      .maybeSingle();

    await supabase.from('conversation_history').insert({
      customer_id: customer?.id || null,
      phone: from,
      message: text,
      role: 'user',
      timestamp: new Date().toISOString()
    });

    const config = await getConfig();

    if (config.auto_reply && config.openai_key && text) {
      try {
        const { data: conversationStatus } = await supabase
          .from('conversations')
          .select('ai_paused, customer_phone')
          .eq('customer_phone', from)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conversationStatus?.ai_paused) {
          console.log(`IA pausada para ${from}. Resposta automática desabilitada.`);
          return;
        }

        const { data: history } = await supabase
          .from('conversation_history')
          .select('message, role, timestamp')
          .eq('phone', from)
          .order('timestamp', { ascending: false })
          .limit(10);

        let systemPrompt = config.prompt;

        if (customer) {
          systemPrompt += `\n\n=== INFORMAÇÕES DO CLIENTE ===
Nome: ${customer.name}
Telefone: ${customer.phone}
${customer.document ? `CPF/CNPJ: ${customer.document}` : ''}
Valor Devido: R$ ${parseFloat(customer.amount_due).toFixed(2)}
Data de Vencimento: ${customer.due_date || 'Não informada'}
Número da Fatura/Proposta: ${customer.invoice_number || 'Não informado'}
Status: ${customer.status}
${customer.overdue_installments > 0 ? `Parcelas Vencidas: ${customer.overdue_installments}` : ''}

${customer.vehicle_plate || customer.vehicle_brand || customer.vehicle_model ? '=== INFORMAÇÕES DO VEÍCULO ===' : ''}
${customer.vehicle_plate ? `Placa: ${customer.vehicle_plate}` : ''}
${customer.vehicle_brand ? `Marca: ${customer.vehicle_brand}` : ''}
${customer.vehicle_model ? `Modelo: ${customer.vehicle_model}` : ''}
${customer.vehicle_chassis ? `Chassi: ${customer.vehicle_chassis}` : ''}

${customer.contract_status ? `Status do Contrato: ${customer.contract_status}` : ''}
${customer.seller ? `Vendedor: ${customer.seller}` : ''}
Observações: ${customer.notes || 'Nenhuma'}

IMPORTANTE: Você está falando com ${customer.name}. Use essas informações para negociar o pagamento de R$ ${parseFloat(customer.amount_due).toFixed(2)}.`;
        } else {
          systemPrompt += `\n\nATENÇÃO: Este número não está cadastrado no sistema. Pergunte o nome da pessoa e informe que você precisa verificar a situação dela.`;
        }

        const messages = [{ role: 'system', content: systemPrompt }];

        if (history && history.length > 0) {
          history.reverse().forEach(h => {
            messages.push({
              role: h.role,
              content: h.message
            });
          });
        }

        messages.push({ role: 'user', content: text });

        const openai = new OpenAI({ apiKey: config.openai_key });

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages
        });

        const reply = completion.choices[0].message.content;
        const client = whatsapp.getClient();

        if (client) {
          await client.sendMessage(from, reply);

          await supabase.from('conversations').insert({
            phone: from,
            customer_phone: from,
            message: reply,
            type: 'sent',
            timestamp: new Date().toISOString()
          });

          await supabase.from('conversation_history').insert({
            customer_id: customer?.id || null,
            phone: from,
            message: reply,
            role: 'assistant',
            timestamp: new Date().toISOString()
          });

          console.log(`Resposta enviada para ${customer?.name || from}: ${reply}`);
        }
      } catch (error) {
        console.error('Erro ao processar IA:', error);
      }
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}

app.get('/', (req, res) => {
  const status = whatsapp.getConnectionStatus();
  res.json({
    status: 'online',
    connection: status.status,
    phone: status.phoneNumber
  });
});

app.post('/connect', async (req, res) => {
  const status = whatsapp.getConnectionStatus();

  if (status.isConnected) {
    return res.json({ success: false, message: 'Já conectado' });
  }

  try {
    whatsapp.setMessageHandler(handleMessage);
    await whatsapp.initWhatsApp();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/disconnect', async (req, res) => {
  await whatsapp.disconnectWhatsApp();
  res.json({ success: true });
});

app.get('/status', (req, res) => {
  const status = whatsapp.getConnectionStatus();
  res.json({
    status: status.status,
    qr: status.qrCode,
    phone: status.phoneNumber
  });
});

app.get('/config', async (req, res) => {
  const config = await getConfig();
  res.json(config);
});

app.post('/config', async (req, res) => {
  const { openai_key, prompt, auto_reply } = req.body;

  const { data: existing } = await supabase
    .from('bot_config')
    .select('id')
    .maybeSingle();

  if (existing) {
    await supabase
      .from('bot_config')
      .update({ openai_key, prompt, auto_reply })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('bot_config')
      .insert({ openai_key, prompt, auto_reply });
  }

  res.json({ success: true });
});

app.get('/conversations', async (req, res) => {
  const { data: allConversations } = await supabase
    .from('conversations')
    .select('*')
    .order('timestamp', { ascending: false });

  if (!allConversations || allConversations.length === 0) {
    return res.json([]);
  }

  const phoneGroups = {};

  allConversations.forEach(conv => {
    const phone = conv.phone || conv.customer_phone;
    if (!phoneGroups[phone]) {
      phoneGroups[phone] = {
        id: conv.id,
        customer_phone: phone,
        message: conv.message,
        timestamp: conv.timestamp,
        last_message: conv.timestamp,
        ai_paused: conv.ai_paused || false
      };
    }
  });

  const uniqueConversations = Object.values(phoneGroups);

  for (let conv of uniqueConversations) {
    const { data: customer } = await supabase
      .from('customers')
      .select('name')
      .eq('phone', conv.customer_phone)
      .maybeSingle();

    conv.customer_name = customer?.name || null;
  }

  uniqueConversations.sort((a, b) =>
    new Date(b.last_message) - new Date(a.last_message)
  );

  res.json(uniqueConversations);
});

app.post('/test-ai', async (req, res) => {
  const { message } = req.body;
  const config = await getConfig();

  if (!config.openai_key) {
    return res.status(400).json({ error: 'Chave OpenAI não configurada' });
  }

  try {
    const openai = new OpenAI({ apiKey: config.openai_key });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: config.prompt },
        { role: 'user', content: message }
      ]
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/customers', async (req, res) => {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  res.json(data || []);
});

app.post('/customers', async (req, res) => {
  const {
    phone, name, amount_due, due_date, invoice_number, notes, status,
    vehicle_plate, vehicle_chassis, vehicle_brand, vehicle_model,
    document, contract_status, overdue_installments, tracker_id,
    renewal_status, contract_renewal, installation_date, validity_date,
    seller, installment_value, total_value, raw_data
  } = req.body;

  if (!phone || !name || !amount_due) {
    return res.status(400).json({ error: 'Campos obrigatórios: phone, name, amount_due' });
  }

  const customerData = {
    phone,
    name,
    amount_due: parseFloat(amount_due),
    due_date: due_date || null,
    invoice_number: invoice_number || '',
    notes: notes || '',
    status: status || 'pending',
    vehicle_plate: vehicle_plate || null,
    vehicle_chassis: vehicle_chassis || null,
    vehicle_brand: vehicle_brand || null,
    vehicle_model: vehicle_model || null,
    document: document || null,
    contract_status: contract_status || null,
    overdue_installments: overdue_installments || 0,
    tracker_id: tracker_id || null,
    renewal_status: renewal_status || null,
    contract_renewal: contract_renewal || null,
    installation_date: installation_date || null,
    validity_date: validity_date || null,
    seller: seller || null,
    installment_value: installment_value ? parseFloat(installment_value) : null,
    total_value: total_value ? parseFloat(total_value) : null,
    raw_data: raw_data || {}
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

app.post('/customers/bulk', async (req, res) => {
  const { customers } = req.body;

  if (!Array.isArray(customers) || customers.length === 0) {
    return res.status(400).json({ error: 'Envie um array de clientes' });
  }

  try {
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, phone, name, status, notes')
      .neq('status', 'paid');

    const newPhones = customers.map(c => c.phone);

    const customersToMarkAsPaid = existingCustomers
      ? existingCustomers.filter(c => !newPhones.includes(c.phone))
      : [];

    if (customersToMarkAsPaid.length > 0) {
      const today = new Date().toISOString().split('T')[0];

      for (const customer of customersToMarkAsPaid) {
        await supabase
          .from('customers')
          .update({
            status: 'paid',
            notes: customer.notes
              ? `${customer.notes}\n\n[${today}] Marcado como pago automaticamente - removido da lista de devedores`
              : `[${today}] Marcado como pago automaticamente - removido da lista de devedores`
          })
          .eq('id', customer.id);
      }
    }

    const validCustomers = customers.map(c => ({
      phone: c.phone,
      name: c.name,
      amount_due: parseFloat(c.amount_due) || 0,
      due_date: c.due_date || null,
      invoice_number: c.invoice_number || '',
      notes: c.notes || '',
      status: c.status || 'pending',
      vehicle_plate: c.vehicle_plate || null,
      vehicle_chassis: c.vehicle_chassis || null,
      vehicle_brand: c.vehicle_brand || null,
      vehicle_model: c.vehicle_model || null,
      document: c.document || null,
      contract_status: c.contract_status || null,
      overdue_installments: c.overdue_installments || 0,
      tracker_id: c.tracker_id || null,
      renewal_status: c.renewal_status || null,
      contract_renewal: c.contract_renewal || null,
      installation_date: c.installation_date || null,
      validity_date: c.validity_date || null,
      seller: c.seller || null,
      installment_value: c.installment_value ? parseFloat(c.installment_value) : null,
      total_value: c.total_value ? parseFloat(c.total_value) : null,
      raw_data: c.raw_data || {}
    }));

    const { data, error } = await supabase
      .from('customers')
      .upsert(validCustomers, { onConflict: 'phone' })
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      imported: data.length,
      markedAsPaid: customersToMarkAsPaid.length,
      paidCustomers: customersToMarkAsPaid.map(c => c.name)
    });
  } catch (error) {
    console.error('Erro ao processar importação:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { phone, name, amount_due, due_date, invoice_number, notes, status } = req.body;

  const { data, error } = await supabase
    .from('customers')
    .update({
      phone,
      name,
      amount_due: parseFloat(amount_due),
      due_date,
      invoice_number,
      notes,
      status
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

app.delete('/customers/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true });
});

app.get('/customers/:id/history', async (req, res) => {
  const { id } = req.params;

  const { data } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('customer_id', id)
    .order('timestamp', { ascending: true });

  res.json(data || []);
});

app.post('/send-message', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }

  const status = whatsapp.getConnectionStatus();
  if (!status.isConnected) {
    return res.status(503).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const client = whatsapp.getClient();
    if (!client) {
      return res.status(503).json({ error: 'Cliente WhatsApp não disponível' });
    }

    let phoneNumber = to.replace(/\D/g, '');
    if (!phoneNumber.includes('@')) {
      phoneNumber = phoneNumber + '@c.us';
    }

    await client.sendMessage(phoneNumber, message);

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phoneNumber)
      .maybeSingle();

    await supabase.from('conversations').insert({
      phone: phoneNumber,
      customer_phone: phoneNumber,
      message: message,
      type: 'sent',
      timestamp: new Date().toISOString()
    });

    await supabase.from('conversation_history').insert({
      customer_id: customer?.id || null,
      phone: phoneNumber,
      message: message,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, phone: phoneNumber });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/conversations/:id/send-message', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('customer_phone')
    .eq('id', id)
    .single();

  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }

  const status = whatsapp.getConnectionStatus();
  if (!status.isConnected) {
    return res.status(503).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const client = whatsapp.getClient();
    if (!client) {
      return res.status(503).json({ error: 'Cliente WhatsApp não disponível' });
    }

    await client.sendMessage(conversation.customer_phone, message);

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', conversation.customer_phone)
      .maybeSingle();

    await supabase.from('conversation_history').insert({
      customer_id: customer?.id || null,
      phone: conversation.customer_phone,
      message: message,
      role: 'assistant',
      timestamp: new Date().toISOString()
    });

    await supabase
      .from('conversations')
      .update({ last_message: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/conversations/:id/messages', async (req, res) => {
  const { id } = req.params;

  const { data: conversation } = await supabase
    .from('conversations')
    .select('customer_phone, phone')
    .eq('id', id)
    .maybeSingle();

  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada' });
  }

  const phone = conversation.customer_phone || conversation.phone;

  const { data: messages } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('phone', phone)
    .order('timestamp', { ascending: true });

  res.json(messages || []);
});

app.put('/conversations/:id/toggle-ai', async (req, res) => {
  const { id } = req.params;
  const { ai_paused } = req.body;

  const { data, error } = await supabase
    .from('conversations')
    .update({ ai_paused })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

whatsapp.setIOInstance(io);

io.on('connection', (socket) => {
  console.log('Cliente Socket.IO conectado');

  const status = whatsapp.getConnectionStatus();
  socket.emit('status_update', status);

  if (status.qrCode) {
    socket.emit('qr_code', {
      success: true,
      qrCode: status.qrCode,
      message: 'QR Code disponível'
    });
  }

  socket.on('disconnect', () => {
    console.log('Cliente Socket.IO desconectado');
  });
});
