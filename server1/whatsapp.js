import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

let client = null;
let qrCodeData = null;
let connectionStatus = 'disconnected';
let phoneNumber = null;
let onMessageCallback = null;
let onStatusCallback = null;

export function initialize() {
  if (client) {
    return client;
  }

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'server1' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', async (qr) => {
    console.log('🔳 QR Code gerado');
    qrCodeData = await qrcode.toDataURL(qr);
    connectionStatus = 'qr';
    if (onStatusCallback) {
      onStatusCallback({ status: 'qr', qr: qrCodeData, phone: null });
    }
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp conectado!');
    phoneNumber = client.info.wid.user;
    connectionStatus = 'connected';
    qrCodeData = null;
    if (onStatusCallback) {
      onStatusCallback({ status: 'connected', qr: null, phone: phoneNumber });
    }
  });

  client.on('authenticated', () => {
    console.log('🔐 Autenticado');
    connectionStatus = 'authenticated';
  });

  client.on('auth_failure', () => {
    console.log('❌ Falha na autenticação');
    connectionStatus = 'disconnected';
    qrCodeData = null;
    if (onStatusCallback) {
      onStatusCallback({ status: 'disconnected', qr: null, phone: null });
    }
  });

  client.on('disconnected', () => {
    console.log('⚠️ Desconectado');
    connectionStatus = 'disconnected';
    phoneNumber = null;
    qrCodeData = null;
    if (onStatusCallback) {
      onStatusCallback({ status: 'disconnected', qr: null, phone: null });
    }
  });

  client.on('message', async (msg) => {
    if (onMessageCallback) {
      onMessageCallback(msg);
    }
  });

  return client;
}

export async function connect() {
  if (!client) {
    initialize();
  }

  if (connectionStatus === 'connected') {
    return { success: true, message: 'Já conectado', qr: null };
  }

  try {
    await client.initialize();
    return { success: true, message: 'Inicializando...', qr: qrCodeData };
  } catch (error) {
    console.error('Erro ao conectar:', error);
    return { success: false, message: error.message, qr: null };
  }
}

export async function disconnect() {
  if (client) {
    await client.destroy();
    client = null;
    connectionStatus = 'disconnected';
    phoneNumber = null;
    qrCodeData = null;
    return { success: true };
  }
  return { success: false };
}

export async function sendMessage(to, message) {
  if (!client || connectionStatus !== 'connected') {
    throw new Error('WhatsApp não conectado');
  }

  const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
  const sentMsg = await client.sendMessage(chatId, message);
  return sentMsg;
}

export function getStatus() {
  return {
    status: connectionStatus,
    phone: phoneNumber,
    qr: qrCodeData
  };
}

export function onMessage(callback) {
  onMessageCallback = callback;
}

export function onStatus(callback) {
  onStatusCallback = callback;
}

export function getClient() {
  return client;
}
