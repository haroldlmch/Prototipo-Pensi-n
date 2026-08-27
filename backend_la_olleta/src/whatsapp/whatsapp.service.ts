import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';

import { Pensionado } from '../pensionados/entities/pensionado.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { Menu } from '../menus/entities/menu.entity';
import { OpcionesMenu } from '../opciones-menu/entities/opciones-menu.entity';
import { ConsumosService } from '../consumos/consumos.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappService.name);
  private sock: WASocket | null = null;
  private isConnected = false;
  private qrCodeString: string | null = null;
  private targetGroupId: string = ''; // ID de grupo asignado opcional

  constructor(
    @InjectRepository(Pensionado)
    private readonly pensionadoRepository: Repository<Pensionado>,

    @InjectRepository(Pensione)
    private readonly pensionRepository: Repository<Pensione>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(OpcionesMenu)
    private readonly opcionMenuRepository: Repository<OpcionesMenu>,

    private readonly consumosService: ConsumosService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Inicializando servicio de WhatsApp (La Olleta)...');
    await this.initWhatsApp();
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      qr: this.qrCodeString,
      targetGroupId: this.targetGroupId,
    };
  }

  public setTargetGroup(groupId: string) {
    this.targetGroupId = groupId;
    this.logger.log(`🎯 Grupo de WhatsApp objetivo configurado: ${groupId}`);
    return { success: true, targetGroupId: this.targetGroupId };
  }

  private async initWhatsApp() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('whatsapp_session');

      this.sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['La Olleta App', 'Chrome', '1.0.0'],
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCodeString = qr;
          this.logger.log('📲 Escanea este código QR en la consola para vincular WhatsApp:');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          if (isLoggedOut) {
            this.logger.warn('🔒 Sesión cerrada desde WhatsApp. Limpiando credenciales y generando nuevo QR...');
            try {
              import('fs').then((fs) => {
                fs.rmSync('whatsapp_session', { recursive: true, force: true });
              });
            } catch (e) {}
            setTimeout(() => this.initWhatsApp(), 2000);
          } else {
            this.logger.warn(`⚠️ Conexión de WhatsApp cerrada (código: ${statusCode}). Reconectando...`);
            setTimeout(() => this.initWhatsApp(), 3000);
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCodeString = null;
          this.logger.log('✅ ¡WhatsApp Conectado con éxito a La Olleta!');
        }
      });

      this.sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg || !msg.message || msg.key.fromMe) return;

        await this.handleIncomingMessage(msg);
      });
    } catch (error) {
      this.logger.error('Error al inicializar WhatsApp socket:', error);
    }
  }

  private async handleIncomingMessage(msg: any) {
    const remoteJid = msg.key.remoteJid || '';
    const isGroup = remoteJid.endsWith('@g.us');

    const text = (
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''
    ).trim();

    if (!text) return;

    // Comando para consultar ID de grupo
    if (text.toLowerCase() === '#id_grupo') {
      await this.sock?.sendMessage(remoteJid, {
        text: `📋 *ID de este grupo:* \`${remoteJid}\`\n\nPuedes registrar este ID en el sistema para limitar los pedidos a este grupo.`,
      });
      return;
    }

    // Filtrar si hay grupo objetivo
    if (this.targetGroupId && remoteJid !== this.targetGroupId) {
      return;
    }

    // Procesar solo si empieza con #pedido
    if (!text.toLowerCase().startsWith('#pedido')) {
      return;
    }

    let sender = msg.key.participant || remoteJid;
    const pushName = msg.pushName || '';

    // Si WhatsApp envía el ID privado @lid en un grupo, resolver el número de teléfono real
    if (isGroup && sender.endsWith('@lid')) {
      try {
        const groupMeta = await this.sock?.groupMetadata(remoteJid);
        const participantObj = groupMeta?.participants?.find(
          (p: any) => p.lid === sender || p.id === sender,
        );
        if (participantObj && participantObj.id) {
          this.logger.log(`🔍 Mapeado LID ${sender} -> Número real: ${participantObj.id}`);
          sender = participantObj.id;
        }
      } catch (err) {
        this.logger.debug('No se pudo resolver LID con groupMetadata:', err);
      }
    }

    const rawPhone = sender.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/:\d+/, '');
    const pedidoDetalle = text.substring(7).trim();

    this.logger.log(`📩 Pedido recibido de +${rawPhone} (${pushName || 'Sin alias'}): "${pedidoDetalle}"`);

    await this.processOrder(remoteJid, msg.key.participant || remoteJid, rawPhone, pushName, pedidoDetalle);
  }

  private getFechaLocalStr(d = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async processOrder(
    remoteJid: string,
    mentionJid: string,
    rawPhone: string,
    pushName: string,
    pedidoDetalle: string,
  ) {
    if (!pedidoDetalle) {
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ *Formato incorrecto*\nPor favor especifica tu pedido. Ejemplo:\n*#pedido 1* o *#pedido Pollo al Horno*`,
        mentions: [mentionJid],
      });
      return;
    }

    // 1. Buscar si el teléfono coincide con algún Pensionado registrado
    const allPensionados = await this.pensionadoRepository.find({
      where: { estado: true },
    });

    const cleanRaw = rawPhone.replace(/\D/g, '');

    let pensionado = allPensionados.find((p) => {
      if (!p.telefono) return false;
      const cleanP = p.telefono.replace(/\D/g, '');
      return cleanRaw.endsWith(cleanP) || cleanP.endsWith(cleanRaw);
    });

    // Fallback: Si no coincide por teléfono y se tiene pushName, buscar por nombre
    if (!pensionado && pushName && pushName.trim().length > 2) {
      const pNameLower = pushName.toLowerCase().trim();
      pensionado = allPensionados.find((p) => {
        const nomLower = p.nombreCompleto.toLowerCase();
        return nomLower.includes(pNameLower) || pNameLower.includes(nomLower);
      });
      if (pensionado) {
        this.logger.log(`💡 Pensionado encontrado por nombre (${pushName} -> ${pensionado.nombreCompleto})`);
      }
    }

    if (!pensionado) {
      this.logger.warn(`Número +${rawPhone} (alias: "${pushName}") no encontrado en base de datos de pensionados.`);
      await this.sock?.sendMessage(remoteJid, {
        text: 
`👋 *LA OLLETA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Hola ${pushName ? '*' + pushName + '*' : ''}, tu número no figura registrado en nuestra lista de pensionados activos.

Si deseas adquirir un plan mensual o realizar una venta casual, comunícate con administración.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    // 2. Buscar Pensión Activa con saldo disponible
    const pension = await this.pensionRepository.findOne({
      where: {
        pensionado: { id: pensionado.id },
        estado: 'ACTIVA',
      },
      order: {
        fechaInicio: 'DESC',
      },
    });

    if (!pension || pension.completosDisponibles <= 0) {
      this.logger.warn(`Pensionado ${pensionado.nombreCompleto} no tiene pensión activa con saldo.`);
      await this.sock?.sendMessage(remoteJid, {
        text:
`⚠️ *LA OLLETA - SIN SALDO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hola *${pensionado.nombreCompleto}*, no tienes una pensión activa o se han agotado tus almuerzos disponibles.

📊 *Almuerzos disponibles:* 0
Por favor renueva tu plan en administración.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    // 3. Buscar Menú del Día de Hoy (usando fecha local exacta)
    const hoyStr = this.getFechaLocalStr();
    const menusHoy = await this.menuRepository.find({
      where: { fecha: hoyStr as any },
      relations: { opcionesMenu: true },
      take: 1,
    });

    let menu = menusHoy[0] || null;

    // Si no hay menú para hoy con fecha exacta, buscar el último menú registrado
    if (!menu || !menu.opcionesMenu || menu.opcionesMenu.length === 0) {
      const ultimosMenus = await this.menuRepository.find({
        relations: { opcionesMenu: true },
        order: { fecha: 'DESC' },
        take: 1,
      });
      menu = ultimosMenus[0] || null;
    }

    let opcionSeleccionada: OpcionesMenu | null = null;

    if (menu && menu.opcionesMenu && menu.opcionesMenu.length > 0) {
      const numOpcion = parseInt(pedidoDetalle, 10);
      if (!isNaN(numOpcion) && numOpcion >= 1 && numOpcion <= menu.opcionesMenu.length) {
        opcionSeleccionada = menu.opcionesMenu[numOpcion - 1];
      } else {
        // Buscar por coincidencia de texto
        const detalleLower = pedidoDetalle.toLowerCase();
        const coincidencia = menu.opcionesMenu.find((op) =>
          detalleLower.includes(op.nombreSegundo.toLowerCase()) ||
          op.nombreSegundo.toLowerCase().includes(detalleLower)
        );
        opcionSeleccionada = coincidencia || menu.opcionesMenu[0];
      }
    } else {
      // Si no hay ninguna opción en BD, buscar o crear una genérica
      const opciones = await this.opcionMenuRepository.find();
      opcionSeleccionada = opciones[0] || null;
    }

    if (!opcionSeleccionada) {
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ No se encontró un menú disponible en el sistema. Por favor consulta con administración.`,
        mentions: [mentionJid],
      });
      return;
    }

    // 4. Registrar Consumo en la Base de Datos
    try {
      await this.consumosService.create({
        idPension: pension.id,
        idOpcionMenu: opcionSeleccionada.id,
        cantidadCompletos: 1,
        tipoConsumo: 'WHATSAPP',
        fecha: hoyStr,
      });

      const saldoRestante = pension.completosDisponibles - 1;

      this.logger.log(`✅ Consumo registrado para ${pensionado.nombreCompleto} (${opcionSeleccionada.nombreSegundo}). Saldo restante: ${saldoRestante}`);

      // 5. Enviar mensaje de confirmación por WhatsApp
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyMessage =
`🍽️ *LA OLLETA - PEDIDO CONFIRMADO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* Registrado en el sistema
👤 *Pensionado:* ${pensionado.nombreCompleto}
🍲 *Sopa:* ${menu?.sopa || 'Del día'}
🍛 *Segundo:* ${opcionSeleccionada.nombreSegundo}
📊 *Almuerzos restantes:* ${saldoRestante}
⏰ *Hora:* ${horaActual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_¡Buen provecho! Tu pedido ya está en cocina._`;

      await this.sock?.sendMessage(remoteJid, {
        text: replyMessage,
        mentions: [mentionJid],
      });

    } catch (err: any) {
      this.logger.error('Error al registrar consumo desde WhatsApp:', err);
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ Ocurrió un error al procesar tu pedido: ${err.message || 'Error interno'}`,
        mentions: [mentionJid],
      });
    }
  }
}
