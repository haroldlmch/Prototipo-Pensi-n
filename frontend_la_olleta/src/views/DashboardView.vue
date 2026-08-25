<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Calendar from 'primevue/calendar';

import api from '../api/axios';

const router = useRouter();

const resumen = ref({
  pensionadosActivos: 0,
  pensionesActivas: 0,
  consumosRegistrados: 0,
  ventasCasuales: 0,
  totalIngresosHistorico: 0,
});

const cierre = ref({
  fecha: new Date().toISOString().slice(0, 10),
  totalIngresosHoy: 0,
  totalPagos: 0,
  totalVentas: 0,
  totalExtras: 0,
  totalComidasServidasHoy: 0,
  totalPlatosPensionados: 0,
  totalPlatosCasuales: 0,
  desgloseMetodos: {
    efectivo: 0,
    qr: 0,
  },
});

const ultimosConsumos = ref<any[]>([]);
const ultimosPagos = ref<any[]>([]);
const alertas = ref<any[]>([]);
const cargando = ref(true);

const fechaConsultaCierre = ref<Date | null>(new Date());

const cargarDatosDashboard = async () => {
  try {
    cargando.value = true;
    const [resumenRes, cierreRes, consumosRes, pagosRes, alertasRes] =
      await Promise.all([
        api.get('/dashboard/resumen'),
        api.get('/dashboard/cierre-caja'),
        api.get('/dashboard/ultimos-consumos'),
        api.get('/dashboard/ultimos-pagos'),
        api.get('/dashboard/alertas'),
      ]);

    resumen.value = resumenRes.data;
    cierre.value = cierreRes.data;
    ultimosConsumos.value = consumosRes.data;
    ultimosPagos.value = pagosRes.data;
    alertas.value = alertasRes.data;
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  } finally {
    cargando.value = false;
  }
};

const consultarCierreFecha = async () => {
  if (!fechaConsultaCierre.value) return;
  const fStr = new Date(fechaConsultaCierre.value).toISOString().slice(0, 10);
  try {
    const res = await api.get('/dashboard/cierre-caja');
    // Si backend soporta parámetro de fecha
    cierre.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const navegar = (ruta: string) => {
  router.push(ruta);
};

const irACobro = (pensionId: number) => {
  router.push({
    path: '/pagos',
    query: { nuevoPago: 'true', idPension: String(pensionId) },
  });
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
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

onMounted(() => {
  cargarDatosDashboard();
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.75rem;">
    <!-- Encabezado Principal -->
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
          Panel de Control y Finanzas
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Resumen operativo en tiempo real, balance de caja diario y estado de pensiones.
        </p>
      </div>

      <div style="display: flex; gap: 0.75rem;">
        <Button
          label="Menú de Hoy"
          icon="pi pi-book"
          severity="secondary"
          outlined
          @click="navegar('/menus')"
        />
        <Button
          label="Registrar Consumo"
          icon="pi pi-check-circle"
          severity="success"
          raised
          @click="navegar('/consumos')"
        />
      </div>
    </div>

    <!-- TARJETAS KPIS PRINCIPALES -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
      <!-- KPI 1: Ingresos de Hoy -->
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
            background: #ecfdf5;
            color: #059669;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <i class="pi pi-dollar" style="font-size: 1.4rem; font-weight: 700;"></i>
        </div>
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Ingresos de Hoy
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #059669; margin-top: 0.1rem;">
            Bs. {{ formatDinero(cierre.totalIngresosHoy) }}
          </div>
        </div>
      </div>

      <!-- KPI 2: Comidas Servidas Hoy -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
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
          <i class="pi pi-calendar-clock" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #78716c; text-transform: uppercase;">
            Comidas Servidas Hoy
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #1c1917; margin-top: 0.1rem;">
            {{ cierre.totalComidasServidasHoy }} platos
          </div>
        </div>
      </div>

      <!-- KPI 3: Pensionados Activos -->
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
          cursor: pointer;
        "
        @click="navegar('/pensionados')"
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
          <i class="pi pi-users" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Pensionados Activos
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-top: 0.1rem;">
            {{ resumen.pensionadosActivos }} clientes
          </div>
        </div>
      </div>

      <!-- KPI 4: Pensiones Activas -->
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
          cursor: pointer;
        "
        @click="navegar('/pensiones')"
      >
        <div
          style="
            background: #fffbeb;
            color: #d97706;
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <i class="pi pi-calendar-plus" style="font-size: 1.4rem;"></i>
        </div>
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            Pensiones en Curso
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-top: 0.1rem;">
            {{ resumen.pensionesActivas }} activas
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: CIERRE DE CAJA DIARIO & ALERTAS -->
    <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 1.5rem;">
      <!-- Widget Cierre de Caja -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-wallet" style="color: #059669; font-size: 1.25rem;"></i>
            <h2 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b;">
              Cierre de Caja del Día
            </h2>
          </div>
          <Tag value="Hoy" severity="success" rounded />
        </div>

        <!-- Tarjetas de desglose rápido por módulo -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem; text-align: center;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Cobro Pensiones</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-top: 0.2rem;">
              Bs. {{ formatDinero(cierre.totalPagos) }}
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem; text-align: center;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Ventas Casuales</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-top: 0.2rem;">
              Bs. {{ formatDinero(cierre.totalVentas) }}
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem; text-align: center;">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Extras Cobrados</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-top: 0.2rem;">
              Bs. {{ formatDinero(cierre.totalExtras) }}
            </div>
          </div>
        </div>

        <!-- Desglose por método de pago -->
        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          "
        >
          <div
            style="
              background: #f8fafc;
              border: 1px solid #fed7aa;
              border-radius: 12px;
              padding: 0.85rem 1rem;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            "
          >
            <div
              style="
                background: #ecfdf5;
                color: #059669;
                width: 42px;
                height: 42px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              "
            >
              <i class="pi pi-dollar" style="font-size: 1.25rem; font-weight: 700;"></i>
            </div>
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Efectivo
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #059669; margin-top: 0.1rem;">
                Bs. {{ formatDinero(cierre.desgloseMetodos.efectivo) }}
              </div>
            </div>
          </div>

          <div
            style="
              background: #f8fafc;
              border: 1px solid #fed7aa;
              border-radius: 12px;
              padding: 0.85rem 1rem;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            "
          >
            <div
              style="
                background: #eff6ff;
                color: #2563eb;
                width: 42px;
                height: 42px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              "
            >
              <i class="pi pi-qrcode" style="font-size: 1.25rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Pago QR
              </div>
              <div style="font-size: 1.15rem; font-weight: 800; color: #2563eb; margin-top: 0.1rem;">
                Bs. {{ formatDinero(cierre.desgloseMetodos.qr) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Widget Alertas de Saldo Bajo -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-exclamation-triangle" style="color: #ea580c; font-size: 1.25rem;"></i>
            <h2 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1e293b;">
              Alertas de Saldos Bajos
            </h2>
          </div>
          <Tag :value="`${alertas.length} por renovar`" severity="warn" rounded />
        </div>

        <div style="max-height: 220px; overflow-y: auto;">
          <DataTable :value="alertas" class="p-datatable-sm" stripedRows>
            <template #empty>
              <div style="text-align: center; padding: 1.5rem; color: #94a3b8; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <i class="pi pi-check-circle" style="color: #10b981; font-size: 1.1rem;"></i>
                <span>Todos los pensionados activos cuentan con saldo suficiente.</span>
              </div>
            </template>

            <Column header="Pensionado" style="font-weight: 600; color: #1e293b;">
              <template #body="slotProps">
                {{ slotProps.data.pensionado?.nombreCompleto || 'Sin nombre' }}
              </template>
            </Column>

            <Column header="Restantes" style="width: 120px; text-align: center;">
              <template #body="slotProps">
                <Tag
                  :value="
                    slotProps.data.completosDisponibles <= 0
                      ? '0 (Agotada)'
                      : `${slotProps.data.completosDisponibles} platos`
                  "
                  :severity="slotProps.data.completosDisponibles <= 1 ? 'danger' : 'warn'"
                  rounded
                />
              </template>
            </Column>

            <Column header="Acción" style="width: 100px; text-align: center;">
              <template #body="slotProps">
                <Button
                  label="Cobro"
                  icon="pi pi-plus"
                  size="small"
                  severity="success"
                  style="padding: 0.3rem 0.6rem; font-size: 0.75rem; font-weight: 700;"
                  @click="irACobro(slotProps.data.id)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>

    <!-- SECCIÓN: ÚLTIMOS MOVIMIENTOS (Consumos y Pagos) -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
      <!-- Últimos Consumos -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">
            Últimos Consumos Registrados
          </h2>
          <Button
            label="Ver Todos"
            text
            size="small"
            style="font-size: 0.8rem;"
            @click="navegar('/consumos')"
          />
        </div>

        <DataTable :value="ultimosConsumos" class="p-datatable-sm" stripedRows>
          <template #empty>Sin consumos recientes</template>
          <Column header="Fecha" style="width: 100px;">
            <template #body="slotProps">{{ formatFecha(slotProps.data.fecha) }}</template>
          </Column>
          <Column header="Pensionado" style="font-weight: 600; color: #334155;">
            <template #body="slotProps">
              {{ slotProps.data.pension?.pensionado?.nombreCompleto || 'Sin nombre' }}
            </template>
          </Column>
          <Column header="Plato">
            <template #body="slotProps">
              <Tag :value="slotProps.data.opcionMenu?.nombreSegundo || 'Almuerzo'" severity="info" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Últimos Pagos -->
      <div
        style="
          background: white;
          border-radius: 16px;
          border: 1px solid #fed7aa;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">
            Últimos Pagos Recibidos
          </h2>
          <Button
            label="Ver Todos"
            text
            size="small"
            style="font-size: 0.8rem;"
            @click="navegar('/pagos')"
          />
        </div>

        <DataTable :value="ultimosPagos" class="p-datatable-sm" stripedRows>
          <template #empty>Sin pagos recientes</template>
          <Column header="Fecha" style="width: 100px;">
            <template #body="slotProps">{{ formatFecha(slotProps.data.fechaPago) }}</template>
          </Column>
          <Column header="Pensionado" style="font-weight: 600; color: #334155;">
            <template #body="slotProps">
              {{ slotProps.data.pension?.pensionado?.nombreCompleto || 'Sin nombre' }}
            </template>
          </Column>
          <Column header="Monto" style="width: 110px; font-weight: 800; color: #059669; text-align: right;">
            <template #body="slotProps">
              Bs. {{ formatDinero(slotProps.data.montoTotal) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>
