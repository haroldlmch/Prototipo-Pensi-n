<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Calendar from 'primevue/calendar';
import Dialog from 'primevue/dialog';
import SelectButton from 'primevue/selectbutton';

import api from '../api/axios';

interface DiaGanancia {
  fecha: string;
  totalVentas: number;
  cantidadCasuales: number;
  totalExtras: number;
  cantidadExtras: number;
  gananciaDirecta: number;
  totalPagosPension: number;
  totalCaja: number;
  platosPensionados: number;
  totalPlatosServidos: number;
}

const getFechaLocalStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const historial = ref<DiaGanancia[]>([]);
const cargando = ref(false);

// Filtros
const opcionesFiltro = [
  { label: 'Últimos 7 días', value: '7' },
  { label: 'Últimos 30 días', value: '30' },
  { label: 'Este Mes', value: 'mes' },
  { label: 'Rango Manual', value: 'manual' },
];
const filtroSeleccionado = ref('30');
const rangoFechas = ref<Date[] | null>(null);

// Modal Detalle del Día
const visibleModalDetalle = ref(false);
const detalleDia = ref<any>(null);
const cargandoDetalle = ref(false);

const cargarHistorial = async () => {
  try {
    cargando.value = true;
    let params: any = { dias: 30 };

    if (filtroSeleccionado.value === '7') {
      params = { dias: 7 };
    } else if (filtroSeleccionado.value === '30') {
      params = { dias: 30 };
    } else if (filtroSeleccionado.value === 'mes') {
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const today = getFechaLocalStr(now);
      params = { fechaInicio: firstDay, fechaFin: today, dias: 60 };
    } else if (filtroSeleccionado.value === 'manual' && rangoFechas.value && rangoFechas.value[0] && rangoFechas.value[1]) {
      const f1 = getFechaLocalStr(new Date(rangoFechas.value[0]));
      const f2 = getFechaLocalStr(new Date(rangoFechas.value[1]));
      params = { fechaInicio: f1, fechaFin: f2, dias: 90 };
    }

    const res = await api.get('/dashboard/historial-ganancias', { params });
    historial.value = res.data;
  } catch (error) {
    console.error('Error al cargar historial de ganancias:', error);
  } finally {
    cargando.value = false;
  }
};

const cambiarFiltro = () => {
  if (filtroSeleccionado.value !== 'manual') {
    cargarHistorial();
  }
};

// Resumen acumulado del periodo
const resumenPeriodo = computed(() => {
  const list = historial.value;
  const gananciaDirectaTotal = list.reduce((sum, d) => sum + Number(d.gananciaDirecta || 0), 0);
  const totalVentasCasuales = list.reduce((sum, d) => sum + Number(d.totalVentas || 0), 0);
  const totalCantidadCasuales = list.reduce((sum, d) => sum + Number(d.cantidadCasuales || 0), 0);
  const totalExtras = list.reduce((sum, d) => sum + Number(d.totalExtras || 0), 0);
  const totalCantidadExtras = list.reduce((sum, d) => sum + Number(d.cantidadExtras || 0), 0);
  const totalAbonosPension = list.reduce((sum, d) => sum + Number(d.totalPagosPension || 0), 0);
  const totalCaja = list.reduce((sum, d) => sum + Number(d.totalCaja || 0), 0);
  const totalPlatos = list.reduce((sum, d) => sum + Number(d.totalPlatosServidos || 0), 0);

  const diasConMovimiento = list.length;
  const promedioGananciaDia = diasConMovimiento > 0 ? gananciaDirectaTotal / diasConMovimiento : 0;

  return {
    gananciaDirectaTotal,
    totalVentasCasuales,
    totalCantidadCasuales,
    totalExtras,
    totalCantidadExtras,
    totalAbonosPension,
    totalCaja,
    totalPlatos,
    diasConMovimiento,
    promedioGananciaDia,
  };
});

const verDetalleDia = async (fecha: string) => {
  try {
    cargandoDetalle.value = true;
    visibleModalDetalle.value = true;
    const res = await api.get('/dashboard/cierre-caja', { params: { fecha } });
    detalleDia.value = res.data;
  } catch (err) {
    console.error('Error al obtener detalle del día:', err);
  } finally {
    cargandoDetalle.value = false;
  }
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const [year, month, day] = fechaStr.slice(0, 10).split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDinero = (monto: any) => {
  const num = Number(monto);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const esHoy = (fechaStr: string) => {
  return fechaStr === getFechaLocalStr();
};

onMounted(() => {
  cargarHistorial();
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.75rem;">
    <!-- Encabezado -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1
          style="
            margin: 0;
            font-size: 2.2rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
          "
        >
          Ganancias y Reportes Financieros
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Control histórico de ventas casuales, extras cobrados y recaudación total día por día.
        </p>
      </div>

      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="cargando"
          @click="cargarHistorial"
        />
      </div>
    </div>

    <!-- Barra de Filtros de Período -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1rem 1.25rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      "
    >
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <span style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
          <i class="pi pi-filter" style="color: #ea580c; margin-right: 0.25rem;"></i>
          Período a consultar:
        </span>
        <SelectButton
          v-model="filtroSeleccionado"
          :options="opcionesFiltro"
          optionLabel="label"
          optionValue="value"
          @change="cambiarFiltro"
          style="font-size: 0.85rem;"
        />
      </div>

      <!-- Rango de fecha manual si se selecciona -->
      <div v-if="filtroSeleccionado === 'manual'" style="display: flex; align-items: center; gap: 0.5rem;">
        <Calendar
          v-model="rangoFechas"
          selectionMode="range"
          :manualInput="false"
          placeholder="Seleccionar rango"
          dateFormat="yy-mm-dd"
          :showIcon="true"
          style="width: 240px; font-size: 0.85rem;"
        />
        <Button
          label="Aplicar"
          icon="pi pi-search"
          severity="warn"
          size="small"
          :disabled="!rangoFechas || !rangoFechas[0] || !rangoFechas[1]"
          @click="cargarHistorial"
        />
      </div>
    </div>

    <!-- TARJETAS ACUMULADAS DEL PERÍODO -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
      <!-- KPI 1: Ganancia Directa Total del Periodo -->
      <div
        style="
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 16px;
          border: 1.5px solid #86efac;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.08);
          display: flex;
          align-items: center;
          gap: 1rem;
        "
      >
        <div
          style="
            background: #16a34a;
            color: white;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(22, 163, 74, 0.25);
          "
        >
          <i class="pi pi-bolt" style="font-size: 1.4rem; font-weight: 700;"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">
            Ganancia Directa Total
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #14532d; margin-top: 0.1rem;">
            Bs. {{ formatDinero(resumenPeriodo.gananciaDirectaTotal) }}
          </div>
          <div style="font-size: 0.72rem; color: #15803d; font-weight: 600;">
            Promedio: Bs. {{ formatDinero(resumenPeriodo.promedioGananciaDia) }} / día
          </div>
        </div>
      </div>

      <!-- KPI 2: Total Ventas Casuales -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 1rem;
        "
      >
        <div
          style="
            background: #fff7ed;
            color: #ea580c;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <i class="pi pi-shop" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #78716c; text-transform: uppercase;">
            Ventas Casuales
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #1c1917; margin-top: 0.1rem;">
            Bs. {{ formatDinero(resumenPeriodo.totalVentasCasuales) }}
          </div>
          <div style="font-size: 0.72rem; color: #78716c;">
            {{ resumenPeriodo.totalCantidadCasuales }} platos vendidos
          </div>
        </div>
      </div>

      <!-- KPI 3: Total Extras Cobrados -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 1rem;
        "
      >
        <div
          style="
            background: #fdf4ff;
            color: #c026d3;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <i class="pi pi-sparkles" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Extras Cobrados
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-top: 0.1rem;">
            Bs. {{ formatDinero(resumenPeriodo.totalExtras) }}
          </div>
          <div style="font-size: 0.72rem; color: #a21caf;">
            {{ resumenPeriodo.totalCantidadExtras }} items (bebidas/postres)
          </div>
        </div>
      </div>

      <!-- KPI 4: Recaudación Total en Caja -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 1rem;
        "
      >
        <div
          style="
            background: #eff6ff;
            color: #2563eb;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <i class="pi pi-wallet" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Recaudación en Caja
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #2563eb; margin-top: 0.1rem;">
            Bs. {{ formatDinero(resumenPeriodo.totalCaja) }}
          </div>
          <div style="font-size: 0.72rem; color: #3b82f6;">
            Incluye Bs. {{ formatDinero(resumenPeriodo.totalAbonosPension) }} de pensiones
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE HISTORIAL DE GANANCIAS -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      "
    >
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-calendar" style="color: #ea580c;"></i>
            Detalle de Ganancias por Día
          </h2>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.85rem; color: #64748b;">
            Haz clic en "Ver Cierre" para auditar cada venta y cobro del día.
          </p>
        </div>
        <Tag :value="`${historial.length} días en el período`" severity="info" rounded />
      </div>

      <DataTable :value="historial" class="p-datatable-sm" stripedRows paginator :rows="12" responsiveLayout="scroll">
        <template #empty>
          <div style="text-align: center; padding: 2.5rem; color: #94a3b8;">
            <i class="pi pi-calendar-times" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
            No se registran movimientos en el período seleccionado.
          </div>
        </template>

        <Column header="Fecha" style="width: 170px; font-weight: 700; color: #1e293b;">
          <template #body="slotProps">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span>{{ formatFecha(slotProps.data.fecha) }}</span>
              <Tag v-if="esHoy(slotProps.data.fecha)" value="Hoy" severity="success" style="font-size: 0.65rem;" />
            </div>
          </template>
        </Column>

        <Column header="Ventas Casuales" style="text-align: center;">
          <template #body="slotProps">
            <div style="font-weight: 700; color: #334155;">
              Bs. {{ formatDinero(slotProps.data.totalVentas) }}
            </div>
            <div style="font-size: 0.72rem; color: #64748b;">
              {{ slotProps.data.cantidadCasuales }} plato(s)
            </div>
          </template>
        </Column>

        <Column header="Extras Cobrados" style="text-align: center;">
          <template #body="slotProps">
            <div style="font-weight: 700; color: #334155;">
              Bs. {{ formatDinero(slotProps.data.totalExtras) }}
            </div>
            <div style="font-size: 0.72rem; color: #64748b;">
              {{ slotProps.data.cantidadExtras }} item(s)
            </div>
          </template>
        </Column>

        <Column header="Ganancia Directa (Casuales + Extras)" style="text-align: center;">
          <template #body="slotProps">
            <Tag
              :value="`Bs. ${formatDinero(slotProps.data.gananciaDirecta)}`"
              severity="success"
              style="font-weight: 800; font-size: 0.85rem; padding: 0.35rem 0.75rem;"
            />
          </template>
        </Column>

        <Column header="Abonos Pensión" style="text-align: center;">
          <template #body="slotProps">
            <span style="font-weight: 600; color: #64748b;">
              Bs. {{ formatDinero(slotProps.data.totalPagosPension) }}
            </span>
          </template>
        </Column>

        <Column header="Total en Caja" style="text-align: center;">
          <template #body="slotProps">
            <span style="font-weight: 800; color: #059669; font-size: 0.95rem;">
              Bs. {{ formatDinero(slotProps.data.totalCaja) }}
            </span>
          </template>
        </Column>

        <Column header="Comidas Servidas" style="text-align: center; width: 140px;">
          <template #body="slotProps">
            <Tag
              :value="`${slotProps.data.totalPlatosServidos} platos`"
              severity="warn"
              rounded
              style="font-size: 0.75rem;"
            />
          </template>
        </Column>

        <Column header="Detalle" style="width: 110px; text-align: center;">
          <template #body="slotProps">
            <Button
              label="Ver Cierre"
              icon="pi pi-eye"
              size="small"
              severity="secondary"
              outlined
              style="padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 700;"
              @click="verDetalleDia(slotProps.data.fecha)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- MODAL DETALLE DE CIERRE DEL DÍA -->
    <Dialog
      v-model:visible="visibleModalDetalle"
      modal
      :header="`Cierre y Balance de Caja - ${detalleDia ? formatFecha(detalleDia.fecha) : ''}`"
      :style="{ width: '650px' }"
    >
      <div v-if="cargandoDetalle" style="text-align: center; padding: 2rem;">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #ea580c;"></i>
      </div>

      <div v-else-if="detalleDia" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Totales Destacados -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #166534; text-transform: uppercase;">
              Ganancia Directa
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #14532d; margin-top: 0.15rem;">
              Bs. {{ formatDinero(detalleDia.gananciaDirectaHoy) }}
            </div>
            <div style="font-size: 0.72rem; color: #15803d;">
              Ventas Casuales + Extras
            </div>
          </div>

          <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 12px; padding: 1rem;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #1e40af; text-transform: uppercase;">
              Total Recaudado en Caja
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #1e3a8a; margin-top: 0.15rem;">
              Bs. {{ formatDinero(detalleDia.totalIngresosHoy) }}
            </div>
            <div style="font-size: 0.72rem; color: #2563eb;">
              Efectivo: Bs. {{ formatDinero(detalleDia.desgloseMetodos.efectivo) }} | QR: Bs. {{ formatDinero(detalleDia.desgloseMetodos.qr) }}
            </div>
          </div>
        </div>

        <!-- Desglose por Concepto -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.4rem;">
            Desglose Financiero del Día
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569;">
            <span>🍛 Ventas Casuales ({{ detalleDia.totalPlatosCasuales }} platos):</span>
            <span style="font-weight: 700; color: #1e293b;">Bs. {{ formatDinero(detalleDia.totalVentas) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569;">
            <span>🥤 Extras Cobrados:</span>
            <span style="font-weight: 700; color: #1e293b;">Bs. {{ formatDinero(detalleDia.totalExtras) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569;">
            <span>💳 Abonos y Pagos de Pensión:</span>
            <span style="font-weight: 700; color: #1e293b;">Bs. {{ formatDinero(detalleDia.totalPagos) }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569;">
            <span>👥 Comidas Servidas a Pensionados:</span>
            <span style="font-weight: 700; color: #1e293b;">{{ detalleDia.totalPlatosPensionados }} platos</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" severity="secondary" @click="visibleModalDetalle = false" />
      </template>
    </Dialog>
  </div>
</template>
