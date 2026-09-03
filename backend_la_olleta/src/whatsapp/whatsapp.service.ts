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
import { Consumo } from '../consumos/entities/consumo.entity';
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

    @InjectRepository(Consumo)
    private readonly consumoRepository: Repository<Consumo>,

    private readonly consumosService: ConsumosService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Inicializando servicio de WhatsApp (L\'OLLETA)...');
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
        browser: ['L\'OLLETA App', 'Chrome', '1.0.0'],
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
          this.logger.log('✅ ¡WhatsApp Conectado con éxito a L\'OLLETA!');
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

  private extractCleanUser(jid: string): string {
    if (!jid) return '';
    const noServer = jid.split('@')[0] || '';
    const noDevice = noServer.split(':')[0] || '';
    return noDevice.replace(/\D/g, '');
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

    // Comandos reconocidos: #id_grupo, #pedido, #cancelar, #saldo, #ayuda
    const textLower = text.toLowerCase();

    // 1. Comando para consultar ID de grupo
    if (textLower === '#id_grupo') {
      await this.sock?.sendMessage(remoteJid, {
        text: `📋 *ID de este grupo:* \`${remoteJid}\`\n\nPuedes registrar este ID en el sistema para limitar los pedidos a este grupo.`,
      });
      return;
    }

    // Filtrar si hay grupo objetivo configurado
    if (this.targetGroupId && remoteJid !== this.targetGroupId) {
      return;
    }

    const esPedido = textLower.startsWith('#pedido');
    const esCancelar = textLower.startsWith('#cancelar') || textLower.startsWith('#cancelarpedido') || textLower.startsWith('#cancelar_pedido');
    const esSaldo = textLower === '#saldo' || textLower === '#consultar' || textLower === '#platos';
    const esAyuda = textLower === '#ayuda' || textLower === '#comandos' || textLower === '#menu_ayuda';

    if (!esPedido && !esCancelar && !esSaldo && !esAyuda) {
      return;
    }

    let sender = msg.key.participant || remoteJid;
    const pushName = msg.pushName || '';

    this.logger.log(`📥 Mensaje recibido de raw JID: "${sender}" (Alias: "${pushName}") | Texto: "${text}"`);

    // 1. Verificar si Baileys ya incluye el número real en propiedades PN
    if ((msg.key as any).participantPn) {
      sender = (msg.key as any).participantPn;
      this.logger.log(`🔍 Teléfono extraído de participantPn: ${sender}`);
    } else if ((msg.key as any).remoteJidPn) {
      sender = (msg.key as any).remoteJidPn;
      this.logger.log(`🔍 Teléfono extraído de remoteJidPn: ${sender}`);
    } else if ((msg.key as any).senderPn) {
      sender = (msg.key as any).senderPn;
      this.logger.log(`🔍 Teléfono extraído de senderPn: ${sender}`);
    } else if (sender.includes('@lid')) {
      // 2. Resolver LID a número de teléfono a través de los participantes del grupo
      const senderLidUser = this.extractCleanUser(sender);
      try {
        let foundRealPn: string | null = null;

        if (isGroup) {
          const groupMeta = await this.sock?.groupMetadata(remoteJid);
          if (groupMeta && groupMeta.participants) {
            const participantObj = groupMeta.participants.find((p: any) => {
              const pLidUser = this.extractCleanUser(p.lid || '');
              const pIdUser = this.extractCleanUser(p.id || '');
              return (pLidUser && pLidUser === senderLidUser) || (pIdUser && pIdUser === senderLidUser);
            });

            if (participantObj) {
              const cleanId = this.extractCleanUser(participantObj.id || '');
              const cleanPn = this.extractCleanUser((participantObj as any).phoneNumber || (participantObj as any).pn || '');
              
              if (participantObj.id && !participantObj.id.includes('@lid') && cleanId.length >= 7) {
                foundRealPn = participantObj.id;
              } else if (cleanPn.length >= 7) {
                foundRealPn = `${cleanPn}@s.whatsapp.net`;
              }
            }
          }
        }

        // 3. Si no se encontró en el grupo actual, buscar en todos los grupos participantes
        if (!foundRealPn && this.sock?.groupFetchAllParticipating) {
          const allGroups = await this.sock.groupFetchAllParticipating();
          for (const gId in allGroups) {
            const g = allGroups[gId];
            const pObj = g?.participants?.find((p: any) => {
              const pLidUser = this.extractCleanUser(p.lid || '');
              const pIdUser = this.extractCleanUser(p.id || '');
              return (pLidUser && pLidUser === senderLidUser) || (pIdUser && pIdUser === senderLidUser);
            });

            if (pObj) {
              const cleanId = this.extractCleanUser(pObj.id || '');
              const cleanPn = this.extractCleanUser((pObj as any).phoneNumber || (pObj as any).pn || '');
              if (pObj.id && !pObj.id.includes('@lid') && cleanId.length >= 7) {
                foundRealPn = pObj.id;
                break;
              } else if (cleanPn.length >= 7) {
                foundRealPn = `${cleanPn}@s.whatsapp.net`;
                break;
              }
            }
          }
        }

        if (foundRealPn) {
          this.logger.log(`🔍 Mapeado LID ${sender} -> Número real de teléfono: ${foundRealPn}`);
          sender = foundRealPn;
        } else {
          this.logger.warn(`No se pudo resolver el número real para el LID ${sender}.`);
        }
      } catch (err) {
        this.logger.debug('Error al intentar resolver LID:', err);
      }
    }

    const rawPhone = this.extractCleanUser(sender);
    const mentionJid = msg.key.participant || remoteJid;

    if (esAyuda) {
      await this.sock?.sendMessage(remoteJid, {
        text:
`🤖 *L'OLLETA - COMANDOS DISPONIBLES*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *#pedido [platos o número]* : Reservar tu almuerzo de hoy.
  _Ejemplos:_
  • _Por número:_ \`#pedido 1\` o \`#pedido 2\`
  • _Múltiples:_ \`#pedido 2 del 1\` o \`#pedido 1 chuleta, 1 saice\`
  • _Con sopa (Completo):_ \`#pedido 1 completo\` o \`#pedido 2 de la 1 con sopa\`
• *#cancelar* : Cancelar tu pedido de hoy y devolver tus platos.
• *#saldo* : Consultar tus almuerzos disponibles.
• *#ayuda* : Ver esta lista de comandos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    if (esCancelar) {
      this.logger.log(`🚫 Solicitud de cancelación recibida de +${rawPhone} (${pushName || 'Sin alias'})`);
      await this.processCancelOrder(remoteJid, mentionJid, rawPhone, pushName);
      return;
    }

    if (esSaldo) {
      this.logger.log(`📊 Consulta de saldo recibida de +${rawPhone} (${pushName || 'Sin alias'})`);
      await this.processConsultarSaldo(remoteJid, mentionJid, rawPhone, pushName);
      return;
    }

    if (esPedido) {
      const pedidoDetalle = text.substring(7).trim();
      this.logger.log(`📩 Pedido recibido de +${rawPhone} (${pushName || 'Sin alias'}): "${pedidoDetalle}"`);
      await this.processOrder(remoteJid, mentionJid, rawPhone, pushName, pedidoDetalle);
    }
  }

  private getFechaLocalStr(d = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parsePedido(
    rawText: string,
    menuOpciones: OpcionesMenu[],
    nombreSopaMenu?: string,
  ): {
    items: { opcionMenu: OpcionesMenu; cantidad: number }[];
    totalCantidad: number;
    tieneSopa: boolean;
    observacionSopas: string;
  } {
    // 1. Detectar si el cliente pidió explícitamente sopa / completo o si pidió explícitamente solo segundo
    const pideSoloSegundo = /sin\s*sopas?|solo\s*segundos?|solamente\s*segundos?/i.test(rawText);
    const pideCompletoOSopa = /(\d+)\s*sopas?|con\s*sopas?|\bsopas?\b|\bcompletos?\b/i.test(rawText);

    let tieneSopa = false;
    let observacionSopas = 'No (Solo Segundo)';

    if (pideSoloSegundo) {
      tieneSopa = false;
      observacionSopas = 'No (Solo Segundo)';
    } else if (pideCompletoOSopa) {
      tieneSopa = true;
      const countSopaMatch = rawText.match(/(\d+)\s*sopas?/i);
      if (countSopaMatch && countSopaMatch[1]) {
        observacionSopas = `Sí, ${countSopaMatch[1]} sopa(s) (${nombreSopaMenu || 'Sopa del día'})`;
      } else {
        observacionSopas = nombreSopaMenu ? `Sí (${nombreSopaMenu})` : 'Sí (Completo con Sopa)';
      }
    } else {
      // Regla: Si no escribe "sopa" ni "completo", NO se asume sopa, es solo segundo
      tieneSopa = false;
      observacionSopas = 'No (Solo Segundo)';
    }

    // 2. Limpiar palabras clave de sopa/completo
    const cleanText = rawText
      .replace(/(\d+)\s*sopas?/gi, ' ')
      .replace(/sin\s*sopas?|con\s*sopas?|solo\s*segundos?|solamente\s*segundos?|\bsopas?\b|\bcompletos?\b/gi, ' ')
      .trim();

    // 3. Separar por líneas, comas, signos +, o conjunciones ' y ' / ' e '
    const lineas = cleanText
      .split(/[\n,+]|\s+(?:y|e)\s+/i)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const itemsMap = new Map<number, { opcionMenu: OpcionesMenu; cantidad: number }>();

    for (const linea of lineas) {
      let cantidad = 1;
      let opcionEncontrada: OpcionesMenu | null = null;
      const lineaTrim = linea.trim();

      // Caso 1: Solo un número (ej. "1", "2", "3", "#1", "#2", "opcion 1", "opción 2", "segundo 1", "segundo 2", "plato 1")
      const soloNumeroMatch = lineaTrim.match(/^(?:opcion|opción|segundo|plato|#)?\s*(\d+)$/i);
      if (soloNumeroMatch && soloNumeroMatch[1]) {
        const num = parseInt(soloNumeroMatch[1], 10);
        if (num >= 1 && num <= menuOpciones.length) {
          opcionEncontrada = menuOpciones[num - 1] || null;
          cantidad = 1;
        } else if (menuOpciones.length > 0) {
          cantidad = num;
          opcionEncontrada = menuOpciones[0] || null;
        }
      }

      // Caso 2: Cantidad + Opción numérica (ej. "2 del 1", "2 de la 1", "2 de la opcion 2", "2x1", "2*2", "2 opcion 1", "2 #1", "2 del 2")
      if (!opcionEncontrada) {
        const cantYNumOpcionMatch = lineaTrim.match(/^(\d+)\s*(?:x|\*|del?|de\s+la|de)?\s*(?:opcion|opción|segundo|plato|#)?\s*(\d+)$/i);
        if (cantYNumOpcionMatch && cantYNumOpcionMatch[1] && cantYNumOpcionMatch[2]) {
          cantidad = parseInt(cantYNumOpcionMatch[1], 10) || 1;
          const numOpc = parseInt(cantYNumOpcionMatch[2], 10);
          if (numOpc >= 1 && numOpc <= menuOpciones.length) {
            opcionEncontrada = menuOpciones[numOpc - 1] || null;
          }
        }
      }

      // Caso 3: Cantidad al inicio + Nombre de plato (ej. "2 chuletas", "2x chuleta", "2 de saice")
      let textoNombrePlato = lineaTrim;
      if (!opcionEncontrada) {
        const matchInicio = lineaTrim.match(/^(\d+)\s*(?:x|\*|del?|de\s+la|de)?\s*(.+)$/i);
        if (matchInicio && matchInicio[1] && matchInicio[2]) {
          cantidad = parseInt(matchInicio[1], 10) || 1;
          textoNombrePlato = matchInicio[2].trim();
        } else {
          // Patrón: Nombre + Cantidad al final (ej. "chuleta x2", "chuleta 2", "saice: 3")
          const matchFin = lineaTrim.match(/^(.+?)\s*(?:x|\*|\:)?\s*(\d+)$/i);
          if (matchFin && matchFin[1] && matchFin[2]) {
            if (isNaN(Number(matchFin[1].trim()))) {
              cantidad = parseInt(matchFin[2], 10) || 1;
              textoNombrePlato = matchFin[1].trim();
            }
          }
        }

        // Buscar coincidencia por nombre de plato
        const lowerTexto = textoNombrePlato.toLowerCase().trim();
        if (lowerTexto) {
          // A) Coincidencia directa / subcadena
          opcionEncontrada = menuOpciones.find((op) => {
            const nomLower = op.nombreSegundo.toLowerCase();
            return nomLower.includes(lowerTexto) || lowerTexto.includes(nomLower);
          }) || null;

          // B) Coincidencia por palabras individuales
          if (!opcionEncontrada) {
            const palabras = lowerTexto.split(/\s+/).filter((w) => w.length > 2);
            for (const pal of palabras) {
              const matchPal = menuOpciones.find((op) => op.nombreSegundo.toLowerCase().includes(pal));
              if (matchPal) {
                opcionEncontrada = matchPal;
                break;
              }
            }
          }
        }
      }

      // Si se encontró opción válida, acumular en el mapa
      if (opcionEncontrada) {
        if (itemsMap.has(opcionEncontrada.id)) {
          itemsMap.get(opcionEncontrada.id)!.cantidad += cantidad;
        } else {
          itemsMap.set(opcionEncontrada.id, {
            opcionMenu: opcionEncontrada,
            cantidad,
          });
        }
      }
    }

    // Fallback: Si no se pudo parsear ninguna opción pero hay opciones en el menú, usar la primera opción
    if (itemsMap.size === 0 && menuOpciones.length > 0) {
      itemsMap.set(menuOpciones[0].id, {
        opcionMenu: menuOpciones[0],
        cantidad: 1,
      });
    }

    const items = Array.from(itemsMap.values());
    const totalCantidad = items.reduce((sum, item) => sum + item.cantidad, 0);

    return {
      items,
      totalCantidad,
      tieneSopa,
      observacionSopas,
    };
  }

  private async identificarPensionado(rawPhone: string, pushName: string): Promise<Pensionado | null> {
    const allPensionados = await this.pensionadoRepository.find({
      where: { estado: true },
    });

    const cleanRaw = this.extractCleanUser(rawPhone);
    const last8Raw = cleanRaw.length >= 8 ? cleanRaw.slice(-8) : cleanRaw;

    this.logger.log(`🔎 Buscando pensionado para teléfono recibido: "${rawPhone}" -> Clean: "${cleanRaw}" (Últimos 8: "${last8Raw}")`);

    // A) Búsqueda directa por número de teléfono
    let pensionado = allPensionados.find((p) => {
      if (!p.telefono) return false;
      const cleanP = this.extractCleanUser(p.telefono);
      const last8P = cleanP.length >= 8 ? cleanP.slice(-8) : cleanP;

      // Coincidencia exacta de los últimos 8 dígitos (celular boliviano)
      if (last8Raw && last8P && last8Raw.length >= 7 && last8P.length >= 7 && last8Raw === last8P) {
        return true;
      }
      // Coincidencia por sufijo o prefijo
      return cleanRaw.endsWith(cleanP) || cleanP.endsWith(cleanRaw);
    });

    if (pensionado) {
      this.logger.log(`✅ Pensionado encontrado por TELÉFONO: "${pensionado.nombreCompleto}" (Tel BD: ${pensionado.telefono})`);
      return pensionado;
    }

    // B) Fallback: Si no coincide por teléfono y se tiene pushName, buscar por nombre
    if (pushName && pushName.trim().length > 2) {
      const pNameLower = pushName.toLowerCase().trim();
      pensionado = allPensionados.find((p) => {
        const nomLower = p.nombreCompleto.toLowerCase();
        return nomLower.includes(pNameLower) || pNameLower.includes(nomLower);
      });
      if (pensionado) {
        this.logger.log(`💡 Pensionado encontrado por alias/pushName: "${pushName}" -> ${pensionado.nombreCompleto}`);
        return pensionado;
      }
    }

    this.logger.warn(`❌ No se encontró pensionado para teléfono "${rawPhone}" (Clean: "${cleanRaw}") ni por nombre "${pushName}"`);
    return null;
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
        text: `⚠️ *Formato incorrecto*\nPor favor especifica tu pedido. Ejemplo:\n*#pedido 1 salpicon, 1 chuleta, 2 sopas*`,
        mentions: [mentionJid],
      });
      return;
    }

    // 1. Identificar pensionado
    const pensionado = await this.identificarPensionado(rawPhone, pushName);

    if (!pensionado) {
      this.logger.warn(`Número +${rawPhone} (alias: "${pushName}") no encontrado en base de datos de pensionados.`);
      await this.sock?.sendMessage(remoteJid, {
        text: 
`👋 *L'OLLETA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Hola ${pushName ? '*' + pushName + '*' : ''}, tu número no figura registrado en nuestra lista de pensionados activos.

Si deseas adquirir un plan mensual o realizar una venta casual, comunícate con administración.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    // 2. Buscar Pensión Activa con saldo disponible (más reciente por ID)
    const pensiones = await this.pensionRepository.find({
      where: {
        pensionado: { id: pensionado.id },
        estado: 'ACTIVA',
      },
      order: {
        id: 'DESC',
      },
    });

    const pension = pensiones.find((p) => p.completosDisponibles > 0) || pensiones[0] || null;

    if (!pension || pension.completosDisponibles <= 0) {
      this.logger.warn(`Pensionado ${pensionado.nombreCompleto} no tiene pensión activa con saldo.`);
      await this.sock?.sendMessage(remoteJid, {
        text:
`⚠️ *L'OLLETA - SIN SALDO*
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

    const opcionesDisponibles = menu?.opcionesMenu || (await this.opcionMenuRepository.find());

    if (!opcionesDisponibles || opcionesDisponibles.length === 0) {
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ No se encontró un menú disponible en el sistema. Por favor consulta con administración.`,
        mentions: [mentionJid],
      });
      return;
    }

    // 4. Parsear el pedido múltiple (cantidades y platos)
    const parseResult = this.parsePedido(pedidoDetalle, opcionesDisponibles, menu?.sopa);

    if (parseResult.items.length === 0 || parseResult.totalCantidad <= 0) {
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ No se pudo reconocer los platos solicitados. Ejemplo de formato:\n*#pedido 1 salpicon, 1 chuleta, 1 saice*`,
        mentions: [mentionJid],
      });
      return;
    }

    // 5. Verificar si el saldo de la pensión alcanza para todos los platos pedidos
    if (pension.completosDisponibles < parseResult.totalCantidad) {
      this.logger.warn(`Pensionado ${pensionado.nombreCompleto} intentó pedir ${parseResult.totalCantidad} platos pero solo tiene ${pension.completosDisponibles} disponibles.`);
      await this.sock?.sendMessage(remoteJid, {
        text:
`⚠️ *L'OLLETA - SALDO INSUFICIENTE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hola *${pensionado.nombreCompleto}*, solicitaste *${parseResult.totalCantidad} almuerzos*, pero solo tienes *${pension.completosDisponibles} almuerzo(s) disponible(s)* en tu pensión activa.

Por favor ajusta la cantidad o renueva tu plan en administración.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    // 6. Registrar Consumos en la Base de Datos
    try {
      for (const item of parseResult.items) {
        await this.consumosService.create({
          idPension: pension.id,
          idOpcionMenu: item.opcionMenu.id,
          cantidadCompletos: item.cantidad,
          tipoConsumo: 'WHATSAPP',
          tipoPlato: parseResult.tieneSopa ? 'Completo' : 'Solo Segundo',
          estadoEntrega: 'EN_ESPERA',
          fecha: hoyStr,
        });
      }

      // Obtener saldo actualizado
      const pensionActualizada = await this.pensionRepository.findOne({
        where: { id: pension.id },
      });
      const saldoRestante = pensionActualizada
        ? pensionActualizada.completosDisponibles
        : pension.completosDisponibles - parseResult.totalCantidad;

      this.logger.log(`✅ Pedido múltiple (${parseResult.totalCantidad} almuerzos) registrado para ${pensionado.nombreCompleto}. Saldo restante: ${saldoRestante}`);

      // 7. Enviar mensaje de confirmación por WhatsApp
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const detallePlatosTexto = parseResult.items
        .map((it) => `  • ${it.cantidad}x ${it.opcionMenu.nombreSegundo}`)
        .join('\n');

      const detalleSopaTexto = parseResult.observacionSopas;

      const replyMessage =
`🍽️ *L'OLLETA - PEDIDO CONFIRMADO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* Registrado en el sistema
👤 *Pensionado:* ${pensionado.nombreCompleto}

📋 *Detalle del Pedido (${parseResult.totalCantidad} almuerzo${parseResult.totalCantidad > 1 ? 's' : ''}):*
${detallePlatosTexto}
🍲 *Sopa:* ${detalleSopaTexto}

📊 *Almuerzos descontados:* ${parseResult.totalCantidad}
📊 *Almuerzos restantes:* ${saldoRestante}
⏰ *Hora:* ${horaActual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Tu pedido ha sido reservado._`;

      await this.sock?.sendMessage(remoteJid, {
        text: replyMessage,
        mentions: [mentionJid],
      });

    } catch (err: any) {
      this.logger.error('Error al registrar consumos desde WhatsApp:', err);
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ Ocurrió un error al procesar tu pedido: ${err.message || 'Error interno'}`,
        mentions: [mentionJid],
      });
    }
  }

  private async processCancelOrder(
    remoteJid: string,
    mentionJid: string,
    rawPhone: string,
    pushName: string,
  ) {
    const pensionado = await this.identificarPensionado(rawPhone, pushName);

    if (!pensionado) {
      this.logger.warn(`Número +${rawPhone} (alias: "${pushName}") no encontrado al intentar cancelar pedido.`);
      await this.sock?.sendMessage(remoteJid, {
        text:
`👋 *L'OLLETA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Hola ${pushName ? '*' + pushName + '*' : ''}, tu número no figura en nuestra lista de pensionados activos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    const hoyStr = this.getFechaLocalStr();

    // 1. Buscar consumos registrados hoy para este pensionado
    const consumosHoy = await this.consumoRepository.find({
      where: {
        fecha: hoyStr as any,
        pension: {
          pensionado: { id: pensionado.id },
        },
      },
      relations: {
        pension: true,
        opcionMenu: true,
      },
    });

    if (!consumosHoy || consumosHoy.length === 0) {
      this.logger.log(`Pensionado ${pensionado.nombreCompleto} intentó cancelar pero no tiene pedidos hoy (${hoyStr}).`);
      await this.sock?.sendMessage(remoteJid, {
        text:
`⚠️ *L'OLLETA - SIN PEDIDO ACTIVO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hola *${pensionado.nombreCompleto}*, no tienes ningún pedido registrado para el día de hoy (*${hoyStr}*) para cancelar.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    try {
      // 2. Agrupar la cantidad de platos a devolver y los nombres de los platos cancelados
      let totalPlatosDevueltos = 0;
      const platosCanceladosDetalle: string[] = [];

      // Mapear platos por pensión para devolver el saldo exactamente a su pensión correspondiente
      const platosPorPension = new Map<number, { pension: Pensione; cantidad: number }>();

      for (const c of consumosHoy) {
        totalPlatosDevueltos += c.cantidadCompletos;
        const nombrePlato = c.opcionMenu?.nombreSegundo || 'Plato del día';
        platosCanceladosDetalle.push(`  • ${c.cantidadCompletos}x ${nombrePlato}`);

        if (c.pension) {
          const actual = platosPorPension.get(c.pension.id) || { pension: c.pension, cantidad: 0 };
          actual.cantidad += c.cantidadCompletos;
          platosPorPension.set(c.pension.id, actual);
        }
      }

      // 3. Restaurar los platos en las pensiones correspondientes y asegurar que estén ACTIVAS
      let nuevoSaldoDisponible = 0;
      for (const [pensionId, data] of platosPorPension.entries()) {
        const pensionDB = await this.pensionRepository.findOne({ where: { id: pensionId } });
        if (pensionDB) {
          pensionDB.completosDisponibles += data.cantidad;
          pensionDB.estado = 'ACTIVA';
          await this.pensionRepository.save(pensionDB);
          nuevoSaldoDisponible = pensionDB.completosDisponibles;
        }
      }

      // 4. Eliminar los registros de consumos de la base de datos
      await this.consumoRepository.remove(consumosHoy);

      this.logger.log(`🗑️ Pedido cancelado para ${pensionado.nombreCompleto}: ${totalPlatosDevueltos} platos devueltos a la pensión. Nuevo saldo: ${nuevoSaldoDisponible}`);

      // 5. Enviar mensaje de confirmación por WhatsApp
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyMessage =
`🚫 *L'OLLETA - PEDIDO CANCELADO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *Estado:* Cancelado con éxito
👤 *Pensionado:* ${pensionado.nombreCompleto}

📋 *Platos cancelados (${totalPlatosDevueltos} almuerzo${totalPlatosDevueltos > 1 ? 's' : ''}):*
${platosCanceladosDetalle.join('\n')}

🔄 *Almuerzos devueltos a tu cuenta:* +${totalPlatosDevueltos}
📊 *Saldo actual disponible:* ${nuevoSaldoDisponible} almuerzos
⏰ *Hora:* ${horaActual}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Tu cupo ha sido liberado y tus platos están listos para tu próximo pedido._`;

      await this.sock?.sendMessage(remoteJid, {
        text: replyMessage,
        mentions: [mentionJid],
      });

    } catch (err: any) {
      this.logger.error('Error al cancelar pedido por WhatsApp:', err);
      await this.sock?.sendMessage(remoteJid, {
        text: `⚠️ Ocurrió un error al cancelar tu pedido: ${err.message || 'Error interno'}`,
        mentions: [mentionJid],
      });
    }
  }

  private async processConsultarSaldo(
    remoteJid: string,
    mentionJid: string,
    rawPhone: string,
    pushName: string,
  ) {
    const pensionado = await this.identificarPensionado(rawPhone, pushName);

    if (!pensionado) {
      await this.sock?.sendMessage(remoteJid, {
        text:
`👋 *L'OLLETA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Hola ${pushName ? '*' + pushName + '*' : ''}, tu número no figura en nuestra lista de pensionados activos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    const pensiones = await this.pensionRepository.find({
      where: {
        pensionado: { id: pensionado.id },
        estado: 'ACTIVA',
      },
      order: {
        id: 'DESC',
      },
    });

    const pension = pensiones.find((p) => p.completosDisponibles > 0) || pensiones[0] || null;

    if (!pension) {
      await this.sock?.sendMessage(remoteJid, {
        text:
`⚠️ *L'OLLETA - SIN PENSIÓN ACTIVA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hola *${pensionado.nombreCompleto}*, actualmente no tienes una pensión activa con saldo.
Por favor comunícate con administración para renovar tu plan.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [mentionJid],
      });
      return;
    }

    await this.sock?.sendMessage(remoteJid, {
      text:
`📊 *L'OLLETA - ESTADO DE CUENTA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Pensionado:* ${pensionado.nombreCompleto}
📋 *Pensión:* #${pension.id}
🍽️ *Almuerzos disponibles:* *${pension.completosDisponibles}* de ${pension.cantidadCompletos}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      mentions: [mentionJid],
    });
  }
}
