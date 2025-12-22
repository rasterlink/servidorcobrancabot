import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';

let client = null;
let qrCodeData = null;
let connectionStatus = {
  isConnected: false,
  phoneNumber: null,
  qrCode: null,
  status: 'disconnected'
};

let ioInstance = null;
let messageHandler = null;

function normalizePhoneNumber(phone) {
  if (!phone) return phone;

  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.startsWith('55') && cleanPhone.length === 12) {
    const ddd = cleanPhone.substring(2, 4);
    const number = cleanPhone.substring(4);
    return `55${ddd}9${number}`;
  }

  return cleanPhone;
}

export function setIOInstance(io) {
  ioInstance = io;
}

export function setMessageHandler(handler) {
  messageHandler = handler;
}

export function getConnectionStatus() {
  return connectionStatus;
}

export async function initWhatsApp(onConnected) {
  return new Promise((resolve, reject) => {
    try {
      if (client) {
        return resolve({
          success: false,
          message: 'Cliente já inicializado'
        });
      }

      client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './auth_session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      client.on('qr', async (qr) => {
        console.log('QR Code recebido! Escaneie com seu WhatsApp.');

        qrCodeData = await QRCode.toDataURL(qr);
        connectionStatus = {
          isConnected: false,
          phoneNumber: null,
          qrCode: qrCodeData,
          status: 'qr_pending'
        };

        if (ioInstance) {
          ioInstance.emit('qr_code', {
            success: true,
            qrCode: qrCodeData,
            message: 'QR Code gerado. Escaneie com seu WhatsApp.'
          });
          ioInstance.emit('status_update', connectionStatus);
        }

        resolve({
          success: true,
          qrCode: qrCodeData,
          message: 'QR Code gerado. Escaneie com seu WhatsApp.'
        });
      });

      client.on('ready', async () => {
        const info = client.info;
        const phoneNumber = normalizePhoneNumber(info.wid.user);

        connectionStatus = {
          isConnected: true,
          phoneNumber: phoneNumber,
          qrCode: null,
          status: 'connected'
        };

        console.log(`WhatsApp conectado! Número: ${phoneNumber}`);

        if (ioInstance) {
          ioInstance.emit('status_update', connectionStatus);
        }

        if (messageHandler) {
          client.on('message', messageHandler);
          console.log('Listener de mensagens registrado');
        }

        if (onConnected) {
          await onConnected(client);
        }
      });

      client.on('authenticated', () => {
        console.log('Autenticado com sucesso!');
      });

      client.on('auth_failure', (msg) => {
        console.error('Falha na autenticação:', msg);
        connectionStatus.status = 'auth_failed';
      });

      client.on('disconnected', (reason) => {
        console.log('Cliente desconectado:', reason);
        connectionStatus = {
          isConnected: false,
          phoneNumber: null,
          qrCode: null,
          status: 'disconnected'
        };
        client = null;
      });

      client.initialize();

    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      reject({
        success: false,
        message: error.message
      });
    }
  });
}

export async function disconnectWhatsApp() {
  if (client) {
    await client.destroy();
    client = null;
  }

  connectionStatus = {
    isConnected: false,
    phoneNumber: null,
    qrCode: null,
    status: 'disconnected'
  };
}

export function getClient() {
  return client;
}
