import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';

// ============================================================================
// CONFIGURACIÓN DE FILTRADO DE GRUPO
// ============================================================================
// Si dejas TARGET_GROUP_ID vacío (''), el bot escuchará cualquier chat/grupo que use '#pedido'.
// Para restringirlo a UN SOLO GRUPO, escribe '#id_grupo' dentro de tu grupo de WhatsApp
// y el bot te dirá el ID exacto para que lo pegues aquí.
const TARGET_GROUP_ID = ''; // Ejemplo: '120363293340256520@g.us'

async function startWhatsAppBot() {
  console.log('\n====================================================');
  console.log('🤖 BOT DE PEDIDOS WHATSAPP - L\'OLLETA');
  console.log('====================================================\n');

  const { state, saveCreds } = await useMultiFileAuthState('whatsapp_session');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['L\'OLLETA Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 ESCANEA ESTE CÓDIGO QR CON WHATSAPP EN TU CELULAR:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        startWhatsAppBot();
      }
    } else if (connection === 'open') {
      console.log('✅ ¡CONECTADO A WHATSAPP!');
      if (TARGET_GROUP_ID) {
        console.log(`🔒 Filtro activado: Solo escuchando el grupo [${TARGET_GROUP_ID}]`);
      } else {
        console.log('ℹ️ Modo global: Escuchando cualquier grupo/chat que use "#pedido"');
        console.log('💡 Tip: Escribe "#id_grupo" en tu grupo de pensión para obtener su ID.');
      }
      console.log('\n🤫 La terminal se mantendrá limpia. Solo se mostrarán pedidos reales.\n');
    }
  });

  // Escuchar mensajes entrantes
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg || !msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid || '';
    const isGroup = remoteJid.endsWith('@g.us');

    // 1. Extraer texto del mensaje
    const text = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim();

    // 2. Si el mensaje está vacío o no es texto (reacciones, stickers, etc.), ignorar en silencio
    if (!text) return;

    // 3. Comando auxiliar para obtener el ID de un grupo fácilmente
    if (text.toLowerCase() === '#id_grupo') {
      console.log(`\n📌 ID del grupo solicitado: ${remoteJid}`);
      await sock.sendMessage(remoteJid, {
        text: `📋 *ID de este grupo:* \`${remoteJid}\`\n\nPuedes colocar este ID en la configuración del bot para que solo escuche aquí.`,
      });
      return;
    }

    // 4. Si se configuró un grupo específico y el mensaje NO proviene de ese grupo, ignorar
    if (TARGET_GROUP_ID && remoteJid !== TARGET_GROUP_ID) {
      return;
    }

    // 5. Solo procesar si el mensaje inicia con '#pedido'
    if (!text.toLowerCase().startsWith('#pedido')) {
      return;
    }

    // 6. Obtener datos del remitente
    const sender = msg.key.participant || remoteJid;
    const cleanPhone = sender.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/:\d+/, '');
    const pedidoDetalle = text.substring(7).trim();

    if (!pedidoDetalle) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ *Formato incorrecto*\nPor favor especifica tu pedido. Ejemplo:\n*#pedido 1 Pollo al horno con sopa*`,
        mentions: [sender],
      });
      return;
    }

    // 7. Mostrar pedido limpio en la terminal
    console.log('\n🔔 ===============================================');
    console.log(`🛎️ ¡NUEVO PEDIDO RECIBIDO! [${new Date().toLocaleTimeString()}]`);
    console.log(`   📍 Origen: ${isGroup ? 'Grupo de Pensión' : 'Chat Privado'}`);
    console.log(`   👤 Remitente: +${cleanPhone}`);
    console.log(`   🍽️ Pedido: "${pedidoDetalle}"`);
    console.log('==================================================\n');

    try {
      // Respuesta de confirmación
      const replyText = 
`🍽️ *L'OLLETA - PEDIDO CONFIRMADO*
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* Registrado en sistema
👤 *Cliente:* +${cleanPhone}
📋 *Detalle:* ${pedidoDetalle}
⏰ *Hora:* ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━━━━━
_Tu pedido ha sido reservado._`;

      await sock.sendMessage(remoteJid, {
        text: replyText,
        mentions: [sender],
      });

      console.log(`📤 Confirmación enviada al cliente (+${cleanPhone}) con éxito.`);
    } catch (err) {
      console.error('❌ Error al enviar confirmación en WhatsApp:', err);
    }
  });
}

startWhatsAppBot().catch((err) => {
  console.error('Error al iniciar bot:', err);
});
