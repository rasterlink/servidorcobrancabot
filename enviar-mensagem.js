#!/usr/bin/env node

const API_URL = 'https://cobranca-bot-server-production.up.railway.app';
const numero = '5511947957652';
const mensagem = 'Sistema funcionando! Esta e uma mensagem de teste do sistema de cobranca automatica.';

async function enviarMensagem() {
  console.log('📱 Enviando mensagem...');
  console.log('📞 Para:', numero);
  console.log('💬 Mensagem:', mensagem);
  console.log('');

  try {
    const response = await fetch(`${API_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: numero,
        message: mensagem
      })
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok) {
        console.log('✅ Mensagem enviada com sucesso!');
        console.log('📊 Resposta:', data);
      } else {
        console.log('❌ Erro ao enviar mensagem');
        console.log('🔴 Status:', response.status);
        console.log('📊 Resposta:', data);
      }
    } else {
      const text = await response.text();
      console.log('❌ Resposta não-JSON do servidor:');
      console.log('🔴 Status:', response.status);
      console.log('📄 Resposta:', text);

      if (text.includes('Cannot POST')) {
        console.log('');
        console.log('⚠️  A rota /send-message não existe no servidor Railway.');
        console.log('💡 Você precisa fazer deploy da versão atualizada do servidor.');
        console.log('');
        console.log('📋 Comandos para atualizar o servidor:');
        console.log('   cd server');
        console.log('   git add .');
        console.log('   git commit -m "Add send-message endpoint"');
        console.log('   git push');
      }
    }
  } catch (error) {
    console.log('❌ Erro na requisição');
    console.log('🔴', error.message);
  }
}

enviarMensagem();
