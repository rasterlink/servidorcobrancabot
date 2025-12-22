import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as whatsapp from './whatsapp.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

let openai = null;

async function getConfig() {
  const { data } = await supabase
    .from('bot_config')
    .select('*')
    .maybeSingle();

  return data || { openai_key: '', prompt: 'Você é um assistente de cobrança.', auto_reply: false };
}

async function initOpenAI() {
  const config = await getConfig();
  if (config.openai_key) {
    openai = new OpenAI({ apiKey: config.openai_key });
  }
}

initOpenAI();

whatsapp.onMessage(async (msg) => {
  try {
    const from = msg.from;
    const body = msg.body;

    await supabase.from('conversations').insert({
      phone: from,
      message: body,
      type: 'received',
      timestamp: new Date().toISOString()
    });

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', from)
      .maybeSingle();

    if (customer) {
      await supabase.from('conversation_history').insert({
        customer_id: customer.id,
        phone: from,
        message: body,
        role: 'user',
        timestamp: new Date().toISOString()
      });
    }

    io.emit('message', { from, body, timestamp: new Date().toISOString() });

    const config = await getConfig();
    if (config.auto_reply && openai && customer) {
      const { data: history } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('timestamp', { ascending: true })
        .limit(10);

      const messages = [
        { role: 'system', content: config.prompt },
        { role: 'system', content: `Cliente: ${customer.name}, Valor devido: R$ ${customer.amount_due}, Vencimento: ${customer.due_date}` }
      ];

      if (history) {
        history.forEach(h => {
          messages.push({ role: h.role, content: h.message });
        });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages
      });

      const reply = completion.choices[0].message.content;
      await whatsapp.sendMessage(from, reply);

      await supabase.from('conversations').insert({
        phone: from,
        message: reply,
        type: 'sent',
        timestamp: new Date().toISOString()
      });

      await supabase.from('conversation_history').insert({
        customer_id: customer.id,
        phone: from,
        message: reply,
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
});

whatsapp.onStatus((status) => {
  io.emit('status_update', status);
});

app.get('/', (req, res) => {
  const status = whatsapp.getStatus();
  res.json({
    status: 'online',
    connection: status.status,
    phone: status.phone
  });
});

app.get('/status', (req, res) => {
  const status = whatsapp.getStatus();
  res.json(status);
});

app.post('/connect', async (req, res) => {
  try {
    const result = await whatsapp.connect();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/disconnect', async (req, res) => {
  try {
    const result = await whatsapp.disconnect();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Faltam parâmetros' });
    }

    const sentMsg = await whatsapp.sendMessage(to, message);

    await supabase.from('conversations').insert({
      phone: to,
      message: message,
      type: 'sent',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, messageId: sentMsg.id._serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/config', async (req, res) => {
  try {
    const { openai_key, prompt, auto_reply } = req.body;

    const { data: existing } = await supabase
      .from('bot_config')
      .select('*')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('bot_config')
        .update({ openai_key, prompt, auto_reply, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('bot_config')
        .insert({ openai_key, prompt, auto_reply });
    }

    await initOpenAI();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/customers', async (req, res) => {
  try {
    const customer = req.body;
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
