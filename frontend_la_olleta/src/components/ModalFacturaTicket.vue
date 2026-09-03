<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';

export interface ItemComprobante {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ComprobanteData {
  tipo: 'PENSION' | 'VENTA_CASUAL';
  titulo?: string;
  numeroComprobante: string;
  fecha: string;
  hora: string;
  clienteNombre: string;
  clienteNitCi?: string;
  items: ItemComprobante[];
  montoTotal: number;
  metodoPago: string;
  saldoRestante?: number;
  totalPlatos?: number;
  observaciones?: string;
}

const props = defineProps<{
  visible: boolean;
  comprobante: ComprobanteData | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const formatoSeleccionado = ref<'TICKET' | 'ESTANDAR'>('TICKET');
const opcionesFormato = [
  { label: '🧾 Ticket Térmico (80mm)', value: 'TICKET' },
  { label: '📄 Recibo / Factura Estándar', value: 'ESTANDAR' },
];

const nombreClienteEditable = ref('');
const nitCiEditable = ref('');

watch(
  () => props.comprobante,
  (val) => {
    if (val) {
      nombreClienteEditable.value = val.clienteNombre || 'Cliente Casual';
      nitCiEditable.value = val.clienteNitCi || 'S/N';
    }
  },
  { immediate: true }
);

const formatearMonto = (monto: number | string | undefined) => {
  const num = Number(monto) || 0;
  return `Bs. ${num.toFixed(2)}`;
};

const imprimirComprobante = () => {
  if (!props.comprobante) return;

  const esTicket = formatoSeleccionado.value === 'TICKET';
  const selector = esTicket ? '#ticket-render-node' : '#factura-render-node';
  const elemento = document.querySelector(selector);

  if (!elemento) {
    window.print();
    return;
  }

  // Crear un iframe temporal aislado para imprimir exclusivamente el comprobante
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const estiloTicket = `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 5mm 4mm;
      width: 72mm;
      background: #ffffff;
      color: #000000;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.35;
      box-sizing: border-box;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .left { text-align: left; }
    .bold { font-weight: 900; }
    .small { font-size: 10.5px; }
    .title { font-size: 17px; font-weight: 900; letter-spacing: 0.5px; }
    .divider-dashed { border-top: 1px dashed #000000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
    th { text-align: left; border-bottom: 1px solid #000000; padding: 3px 0; }
    td { padding: 3px 0; vertical-align: top; }
    .row-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 5px; }
    .saldo-box { margin-top: 6px; padding: 4px; border: 1px solid #000000; text-align: center; font-size: 11px; font-weight: 900; }
  `;

  const estiloEstandar = `
    @page {
      size: letter portrait;
      margin: 12mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .small { font-size: 10.5px; }
    .factura-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #000; padding-bottom: 10px; }
    .factura-logo { font-size: 22px; font-weight: 900; }
    .factura-num-box { text-align: right; border: 1.5px solid #000; padding: 6px 14px; }
    .factura-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin: 14px 0; font-size: 11.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11.5px; }
    th { border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 7px 5px; text-align: left; background: #f4f4f4; }
    td { padding: 7px 5px; border-bottom: 1px solid #ddd; }
    .factura-total-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
    .factura-total-box { width: 65mm; border: 1.5px solid #000; padding: 8px 12px; }
    .row-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; }
    .factura-footer { margin-top: 28px; border-top: 1px dashed #000; padding-top: 10px; text-align: center; font-size: 11px; }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante_${props.comprobante.numeroComprobante}</title>
        <style>
          ${esTicket ? estiloTicket : estiloEstandar}
        </style>
      </head>
      <body>
        ${elemento.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 250);
};
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Comprobante de Pago — #${comprobante?.numeroComprobante || ''}`"
    :style="{ width: '680px' }"
    @update:visible="(val) => emit('update:visible', val)"
  >
    <div v-if="comprobante" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Barra superior: Selector de Formato y Botón de Impresión -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
        <SelectButton
          v-model="formatoSeleccionado"
          :options="opcionesFormato"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          style="font-size: 0.85rem;"
        />

        <Button
          label="Imprimir Comprobante"
          icon="pi pi-print"
          style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: none; font-weight: 700; padding: 0.6rem 1.25rem; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.3);"
          @click="imprimirComprobante"
        />
      </div>

      <!-- Edición rápida de Datos del Cliente -->
      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 0.75rem; background: #fff7ed; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #fed7aa;">
        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #9a3412;">Señor(es) / Razón Social:</label>
          <InputText
            v-model="nombreClienteEditable"
            placeholder="Nombre o Razón Social..."
            style="font-size: 0.85rem; padding: 0.45rem 0.65rem;"
          />
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <label style="font-size: 0.78rem; font-weight: 700; color: #9a3412;">NIT / C.I.:</label>
          <InputText
            v-model="nitCiEditable"
            placeholder="NIT o CI..."
            style="font-size: 0.85rem; padding: 0.45rem 0.65rem;"
          />
        </div>
      </div>

      <!-- Contenedor de Vista Previa en Pantalla -->
      <div style="display: flex; justify-content: center; background: #334155; padding: 1.5rem; border-radius: 12px; overflow-x: auto;">
        
        <!-- VISTA PREVIA 1: TICKET TÉRMICO (80mm) -->
        <div
          v-if="formatoSeleccionado === 'TICKET'"
          style="
            width: 320px;
            background: #ffffff;
            color: #1e293b;
            font-family: 'Courier New', Courier, monospace;
            padding: 1.25rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
            font-size: 13px;
            line-height: 1.35;
          "
        >
          <div style="text-align: center; margin-bottom: 0.5rem;">
            <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px;">L'OLLETA</div>
            <div style="font-size: 11px; font-weight: 700;">PENSIÓN & RESTAURANTE</div>
            <div style="font-size: 11px; color: #475569;">Comida Casera y Tradicional</div>
            <div style="font-size: 10px; color: #64748b;">Sucre - Bolivia</div>
          </div>

          <div style="border-top: 1px dashed #475569; margin: 0.4rem 0;"></div>

          <div style="text-align: center; font-weight: 800; font-size: 13px;">
            {{ comprobante.tipo === 'PENSION' ? 'COMPROBANTE DE RECARGA' : 'TICKET DE VENTA CASUAL' }}
          </div>
          <div style="text-align: center; font-size: 12px; font-weight: 700;">
            N° {{ comprobante.numeroComprobante }}
          </div>

          <div style="border-top: 1px dashed #475569; margin: 0.4rem 0;"></div>

          <div><strong>FECHA:</strong> {{ comprobante.fecha }} {{ comprobante.hora }}</div>
          <div><strong>CLIENTE:</strong> {{ nombreClienteEditable }}</div>
          <div><strong>NIT/CI:</strong> {{ nitCiEditable }}</div>
          <div><strong>MÉTODO:</strong> {{ comprobante.metodoPago }}</div>

          <div style="border-top: 1px dashed #475569; margin: 0.4rem 0;"></div>

          <!-- Tabla de Items -->
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="border-bottom: 1px solid #94a3b8; text-align: left;">
                <th style="padding: 2px 0;">CANT</th>
                <th style="padding: 2px 0;">DETALLE</th>
                <th style="padding: 2px 0; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(it, idx) in comprobante.items" :key="idx">
                <td style="padding: 3px 0; vertical-align: top;">{{ it.cantidad }}x</td>
                <td style="padding: 3px 0;">{{ it.descripcion }}</td>
                <td style="padding: 3px 0; text-align: right; font-weight: 700;">{{ formatearMonto(it.subtotal) }}</td>
              </tr>
            </tbody>
          </table>

          <div style="border-top: 1px dashed #475569; margin: 0.4rem 0;"></div>

          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; margin-top: 0.3rem;">
            <span>TOTAL A PAGAR:</span>
            <span>{{ formatearMonto(comprobante.montoTotal) }}</span>
          </div>

          <div v-if="comprobante.saldoRestante !== undefined" style="margin-top: 0.4rem; background: #f1f5f9; padding: 0.3rem; text-align: center; font-size: 11px; font-weight: 800;">
            SALDO EN PENSIÓN: {{ comprobante.saldoRestante }} PLATOS DISP.
          </div>

          <div style="border-top: 1px dashed #475569; margin: 0.6rem 0;"></div>

          <div style="text-align: center; font-size: 10px; color: #475569;">
            <div>¡GRACIAS POR SU PREFERENCIA!</div>
            <div>Conserve este comprobante para su control.</div>
          </div>
        </div>

        <!-- VISTA PREVIA 2: FACTURA / RECIBO ESTÁNDAR (MEDIA CARTA) -->
        <div
          v-else
          style="
            width: 520px;
            background: #ffffff;
            color: #0f172a;
            font-family: inherit;
            padding: 1.75rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
            font-size: 13px;
          "
        >
          <!-- Cabecera -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ea580c; padding-bottom: 0.75rem;">
            <div>
              <div style="font-size: 20px; font-weight: 900; color: #ea580c; letter-spacing: -0.5px;">
                🍲 L'OLLETA
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #475569;">Pensión & Restaurante</div>
              <div style="font-size: 11px; color: #64748b;">Sucre, Bolivia</div>
            </div>

            <div style="text-align: right; background: #fff7ed; padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid #fed7aa;">
              <div style="font-size: 11px; font-weight: 800; color: #c2410c; text-transform: uppercase;">
                {{ comprobante.tipo === 'PENSION' ? 'Recibo de Pensión' : 'Recibo de Venta' }}
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #9a3412;">
                N° {{ comprobante.numeroComprobante }}
              </div>
            </div>
          </div>

          <!-- Datos de Fecha y Cliente -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1rem 0; font-size: 12px;">
            <div><strong>Fecha de Emisión:</strong> {{ comprobante.fecha }}</div>
            <div><strong>Hora:</strong> {{ comprobante.hora }}</div>
            <div><strong>Cliente:</strong> {{ nombreClienteEditable }}</div>
            <div><strong>NIT / CI:</strong> {{ nitCiEditable }}</div>
            <div><strong>Forma de Pago:</strong> {{ comprobante.metodoPago }}</div>
            <div v-if="comprobante.saldoRestante !== undefined">
              <strong>Saldo Restante:</strong> {{ comprobante.saldoRestante }} platos
            </div>
          </div>

          <!-- Tabla de Productos -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 0.75rem; font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 6px 8px; text-align: left;">Cant.</th>
                <th style="padding: 6px 8px; text-align: left;">Descripción</th>
                <th style="padding: 6px 8px; text-align: right;">P. Unitario</th>
                <th style="padding: 6px 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in comprobante.items"
                :key="idx"
                style="border-bottom: 1px solid #f1f5f9;"
              >
                <td style="padding: 6px 8px; font-weight: 700;">{{ it.cantidad }}</td>
                <td style="padding: 6px 8px;">{{ it.descripcion }}</td>
                <td style="padding: 6px 8px; text-align: right;">{{ formatearMonto(it.precioUnitario) }}</td>
                <td style="padding: 6px 8px; text-align: right; font-weight: 700;">{{ formatearMonto(it.subtotal) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Total -->
          <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
            <div style="width: 220px; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #166534;">
                <span>Total:</span>
                <span>{{ formatearMonto(comprobante.montoTotal) }}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 1.5rem; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem;">
            ¡Gracias por ser parte de Pensión L'OLLETA!
          </div>
        </div>

      </div>
    </div>
  </Dialog>

  <!-- PLANTILLAS HTML PARA INYECCIÓN DIRECTA EN IFRAME DE IMPRESIÓN (OCULTAS EN PANTALLA) -->
  <div v-if="comprobante" style="display: none;">
    <!-- NODO TICKET -->
    <div id="ticket-render-node">
      <div class="center title">L'OLLETA</div>
      <div class="center small bold">PENSIÓN & RESTAURANTE</div>
      <div class="center small">Comida Casera y Tradicional</div>
      <div class="center small">Sucre - Bolivia</div>
      <div class="divider-dashed"></div>

      <div class="center bold">
        {{ comprobante.tipo === 'PENSION' ? 'COMPROBANTE DE RECARGA' : 'TICKET DE VENTA CASUAL' }}
      </div>
      <div class="center bold">N° {{ comprobante.numeroComprobante }}</div>
      <div class="divider-dashed"></div>

      <div><strong>FECHA:</strong> {{ comprobante.fecha }} {{ comprobante.hora }}</div>
      <div><strong>CLIENTE:</strong> {{ nombreClienteEditable }}</div>
      <div><strong>NIT/CI:</strong> {{ nitCiEditable }}</div>
      <div><strong>MÉTODO:</strong> {{ comprobante.metodoPago }}</div>
      <div class="divider-dashed"></div>

      <table>
        <thead>
          <tr>
            <th class="left">CANT</th>
            <th class="left">DETALLE</th>
            <th class="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, idx) in comprobante.items" :key="idx">
            <td>{{ it.cantidad }}x</td>
            <td>{{ it.descripcion }}</td>
            <td class="right bold">{{ formatearMonto(it.subtotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="divider-dashed"></div>

      <div class="row-total">
        <span>TOTAL A PAGAR:</span>
        <span>{{ formatearMonto(comprobante.montoTotal) }}</span>
      </div>

      <div v-if="comprobante.saldoRestante !== undefined" class="saldo-box">
        SALDO EN PENSIÓN: {{ comprobante.saldoRestante }} PLATOS DISP.
      </div>

      <div class="divider-dashed"></div>
      <div class="center small">¡GRACIAS POR SU PREFERENCIA!</div>
      <div class="center small">Conserve este comprobante para su control.</div>
    </div>

    <!-- NODO FACTURA ESTÁNDAR -->
    <div id="factura-render-node">
      <div class="factura-header">
        <div>
          <div class="factura-logo">🍲 L'OLLETA</div>
          <div class="bold">Pensión & Restaurante</div>
          <div class="small">Sucre, Bolivia</div>
        </div>
        <div class="factura-num-box">
          <div class="bold small" style="color: #c2410c;">
            {{ comprobante.tipo === 'PENSION' ? 'RECIBO DE PENSIÓN' : 'RECIBO DE VENTA' }}
          </div>
          <div class="bold" style="font-size: 15px;">N° {{ comprobante.numeroComprobante }}</div>
        </div>
      </div>

      <div class="factura-grid">
        <div><strong>Fecha de Emisión:</strong> {{ comprobante.fecha }}</div>
        <div><strong>Hora:</strong> {{ comprobante.hora }}</div>
        <div><strong>Señor(es):</strong> {{ nombreClienteEditable }}</div>
        <div><strong>NIT / CI:</strong> {{ nitCiEditable }}</div>
        <div><strong>Forma de Pago:</strong> {{ comprobante.metodoPago }}</div>
        <div v-if="comprobante.saldoRestante !== undefined">
          <strong>Saldo en Pensión:</strong> {{ comprobante.saldoRestante }} platos disponibles
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th class="right">P. Unitario</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, idx) in comprobante.items" :key="idx">
            <td class="bold">{{ it.cantidad }}</td>
            <td>{{ it.descripcion }}</td>
            <td class="right">{{ formatearMonto(it.precioUnitario) }}</td>
            <td class="right bold">{{ formatearMonto(it.subtotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="factura-total-wrapper">
        <div class="factura-total-box">
          <div class="row-total">
            <span>Total:</span>
            <span>{{ formatearMonto(comprobante.montoTotal) }}</span>
          </div>
        </div>
      </div>

      <div class="factura-footer small">
        ¡Gracias por su preferencia! — Pensión L'OLLETA
      </div>
    </div>
  </div>
</template>
