#!/usr/bin/env node

const API_URL = 'https://cobranca-bot-server-production.up.railway.app';

console.log('🔍 Testando Sistema de Cobrança Automática\n');
console.log('📡 Servidor:', API_URL, '\n');

async function testarServidor() {
  console.log('1️⃣  Testando conexão com servidor...');

  try {
    const res = await fetch(`${API_URL}/`);
    const data = await res.json();

    if (res.ok) {
      console.log('   ✅ Servidor ONLINE');
      console.log('   📊 Status:', data.status);
      console.log('   📱 WhatsApp:', data.connection);
      if (data.phone) {
        console.log('   📞 Número:', data.phone);
      }
    } else {
      console.log('   ❌ Erro na resposta:', res.status);
    }
  } catch (error) {
    console.log('   ❌ Servidor OFFLINE');
    console.log('   🔴 Erro:', error.message);
    return false;
  }

  console.log('');
  return true;
}

async function testarStatus() {
  console.log('2️⃣  Testando endpoint de status...');

  try {
    const res = await fetch(`${API_URL}/status`);
    const data = await res.json();

    if (res.ok) {
      console.log('   ✅ Status obtido com sucesso');
      console.log('   🔌 Status:', data.status);
      if (data.phone) {
        console.log('   📱 Telefone conectado:', data.phone);
      }
      if (data.qr) {
        console.log('   🔳 QR Code disponível:', data.qr ? 'SIM' : 'NÃO');
      }
    } else {
      console.log('   ❌ Erro:', res.status);
    }
  } catch (error) {
    console.log('   ❌ Erro ao obter status');
    console.log('   🔴', error.message);
  }

  console.log('');
}

async function testarConfig() {
  console.log('3️⃣  Testando configurações...');

  try {
    const res = await fetch(`${API_URL}/config`);
    const data = await res.json();

    if (res.ok) {
      console.log('   ✅ Configurações obtidas');
      console.log('   🤖 OpenAI configurada:', data.openai_key ? 'SIM' : 'NÃO');
      console.log('   ⚡ Resposta automática:', data.auto_reply ? 'ATIVADA' : 'DESATIVADA');
      console.log('   📝 Prompt configurado:', data.prompt ? 'SIM' : 'NÃO');
    } else {
      console.log('   ❌ Erro:', res.status);
    }
  } catch (error) {
    console.log('   ❌ Erro ao obter configurações');
    console.log('   🔴', error.message);
  }

  console.log('');
}

async function testarClientes() {
  console.log('4️⃣  Testando endpoint de clientes...');

  try {
    const res = await fetch(`${API_URL}/customers`);
    const data = await res.json();

    if (res.ok) {
      console.log('   ✅ Clientes obtidos com sucesso');
      console.log('   👥 Total de clientes:', data.length);

      if (data.length > 0) {
        const pendentes = data.filter(c => c.status === 'pending').length;
        const pagos = data.filter(c => c.status === 'paid').length;
        const negociacao = data.filter(c => c.status === 'negotiating').length;

        console.log('   📊 Pendentes:', pendentes);
        console.log('   💰 Pagos:', pagos);
        console.log('   💬 Em negociação:', negociacao);
      }
    } else {
      console.log('   ❌ Erro:', res.status);
    }
  } catch (error) {
    console.log('   ❌ Erro ao obter clientes');
    console.log('   🔴', error.message);
  }

  console.log('');
}

async function testarConversas() {
  console.log('5️⃣  Testando endpoint de conversas...');

  try {
    const res = await fetch(`${API_URL}/conversations`);
    const data = await res.json();

    if (res.ok) {
      console.log('   ✅ Conversas obtidas com sucesso');
      console.log('   💬 Total de conversas:', data.length);
    } else {
      console.log('   ❌ Erro:', res.status);
    }
  } catch (error) {
    console.log('   ❌ Erro ao obter conversas');
    console.log('   🔴', error.message);
  }

  console.log('');
}

async function executarTestes() {
  const servidorOk = await testarServidor();

  if (!servidorOk) {
    console.log('❌ Não foi possível conectar ao servidor!');
    console.log('');
    console.log('🔧 Verifique:');
    console.log('   1. Se o servidor Railway está rodando');
    console.log('   2. Se a URL está correta no .env');
    console.log('   3. Sua conexão com a internet');
    console.log('');
    process.exit(1);
  }

  await testarStatus();
  await testarConfig();
  await testarClientes();
  await testarConversas();

  console.log('✅ Todos os testes concluídos!\n');
  console.log('📋 Próximos passos:');
  console.log('   1. Execute: npm run dev');
  console.log('   2. Abra: http://localhost:5173');
  console.log('   3. Conecte seu WhatsApp na aba "Conexão"');
  console.log('   4. Configure a OpenAI na aba "Configurações"');
  console.log('   5. Comece a usar! 🚀\n');
}

executarTestes();
