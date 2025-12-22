const API_URL = 'https://cobranca-bot-server-production.up.railway.app';

async function testSendMessage() {
  console.log('🧪 Testando envio de mensagem...\n');

  // Primeiro, buscar um cliente da base
  console.log('1️⃣ Buscando clientes com parcelas em atraso...');

  try {
    const response = await fetch(`${API_URL}/customers`);
    const customers = await response.json();

    // Pegar o primeiro cliente com parcelas em atraso
    const customer = customers.find(c => c.overdue_installments > 0);

    if (!customer) {
      console.log('❌ Nenhum cliente com parcelas em atraso encontrado');
      return;
    }

    console.log(`   ✅ Cliente encontrado: ${customer.name}`);
    console.log(`   📱 Telefone: ${customer.phone}`);
    console.log(`   💰 Valor devido: R$ ${customer.amount_due}`);
    console.log(`   📊 Parcelas em atraso: ${customer.overdue_installments}\n`);

    // Tentar enviar mensagem de teste
    console.log('2️⃣ Tentando enviar mensagem de teste...');

    const message = `Olá ${customer.name}! Esta é uma mensagem de teste do sistema de cobranças.`;

    const sendResponse = await fetch(`${API_URL}/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customer.phone,
        message: message
      })
    });

    console.log(`   Status: ${sendResponse.status}`);
    console.log(`   Content-Type: ${sendResponse.headers.get('content-type')}`);

    const contentType = sendResponse.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      const text = await sendResponse.text();
      console.log('\n❌ ERRO: Servidor retornou HTML ao invés de JSON');
      console.log('Primeiros 500 caracteres da resposta:');
      console.log(text.substring(0, 500));
      return;
    }

    const result = await sendResponse.json();

    if (sendResponse.ok) {
      console.log(`   ✅ Mensagem enviada com sucesso!`);
      console.log(`   Resposta:`, result);
    } else {
      console.log(`   ❌ Erro ao enviar mensagem:`);
      console.log(`   ${result.error || 'Erro desconhecido'}`);

      if (result.error === 'WhatsApp não está conectado') {
        console.log('\n⚠️  Você precisa conectar o WhatsApp na aba "Conexão" do aplicativo');
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

testSendMessage();
