const API_URL = 'https://cobranca-bot-server-production.up.railway.app';

async function testConnection() {
  console.log('🔍 Testando conexão com o servidor Railway...');
  console.log(`URL: ${API_URL}\n`);

  try {
    console.log('1️⃣ Testando endpoint raiz (/)...');
    const rootResponse = await fetch(`${API_URL}/`);
    console.log(`   Status: ${rootResponse.status}`);
    console.log(`   Content-Type: ${rootResponse.headers.get('content-type')}`);

    const rootData = await rootResponse.json();
    console.log(`   Resposta:`, rootData);
    console.log(`   ✅ Servidor está respondendo!\n`);

    console.log('2️⃣ Testando endpoint /status...');
    const statusResponse = await fetch(`${API_URL}/status`);
    console.log(`   Status: ${statusResponse.status}`);

    const statusData = await statusResponse.json();
    console.log(`   Status WhatsApp: ${statusData.status}`);
    console.log(`   Telefone: ${statusData.phone || 'Não conectado'}`);
    console.log(`   QR Code disponível: ${statusData.qr ? 'Sim' : 'Não'}\n`);

    if (statusData.status === 'connected') {
      console.log('✅ WhatsApp está conectado!');
      console.log(`   Número: ${statusData.phone}`);
    } else {
      console.log('⚠️  WhatsApp NÃO está conectado');
      console.log('   Você precisa conectar o WhatsApp na aba "Conexão"');
    }

  } catch (error) {
    console.error('\n❌ ERRO ao conectar com o servidor:');
    console.error(`   ${error.message}`);
    console.error('\n⚠️  Possíveis causas:');
    console.error('   - Servidor Railway está offline ou pausado');
    console.error('   - URL incorreta no arquivo .env');
    console.error('   - Problemas de rede/firewall');
    console.error('\nℹ️  Para verificar o status do servidor no Railway:');
    console.error('   railway status --service backend');
    console.error('\nℹ️  Para ver logs do servidor:');
    console.error('   railway logs --service backend');
  }
}

testConnection();
