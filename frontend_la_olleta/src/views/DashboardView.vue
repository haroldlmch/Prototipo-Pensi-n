<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import api from '../api/axios';

const router = useRouter();

const resumen = ref({
  pensionadosActivos: 0,
  pensionesActivas: 0,
  consumosRegistrados: 0,
  ventasCasuales: 0,
});

const ultimosConsumos = ref<any[]>([]);
const ultimosPagos = ref<any[]>([]);
const alertas = ref<any[]>([]);

const cargando = ref(true);
const hoverKpi = ref<number | null>(null);

const cargarDatosDashboard = async () => {
  try {
    cargando.value = true;
    const [resumenRes, consumosRes, pagosRes, alertasRes] = await Promise.all([
      api.get('/dashboard/resumen'),
      api.get('/dashboard/ultimos-consumos'),
      api.get('/dashboard/ultimos-pagos'),
      api.get('/dashboard/alertas'),
    ]);

    resumen.value = resumenRes.data;
    ultimosConsumos.value = consumosRes.data;
    ultimosPagos.value = pagosRes.data;
    alertas.value = alertasRes.data;
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  } finally {
    cargando.value = false;
  }
};

const navegar = (ruta: string) => {
  router.push(ruta);
};

const getTipoConsumoSeverity = (tipo: string) => {
  switch (tipo?.toUpperCase()) {
    case 'ALMUERZO':
      return 'success';
    case 'DESAYUNO':
      return 'info';
    case 'CENA':
      return 'secondary';
    case 'COLACION':
    case 'EXTRA':
      return 'warn';
    default:
      return 'contrast';
  }
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDinero = (monto: any) => {
  const num = Number(monto);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getConsumosRatio = () => {
  const consumos = resumen.value.consumosRegistrados || 0;
  const ventas = resumen.value.ventasCasuales || 0;
  const total = consumos + ventas;
  if (total === 0) return 0;
  return Math.round((consumos / total) * 100);
};

const getVentasCasualesRatio = () => {
  const consumos = resumen.value.consumosRegistrados || 0;
  const ventas = resumen.value.ventasCasuales || 0;
  const total = consumos + ventas;
  if (total === 0) return 0;
  return Math.round((ventas / total) * 100);
};

onMounted(() => {
  cargarDatosDashboard();
});
</script>

<template>
  <div style="padding: 2rem; background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif;">
    <!-- Encabezado y Acciones Rápidas -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin-bottom: 2rem;
      "
    >
      <div>
        <h1
          style="
            margin: 0;
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          "
        >
          La O'lleta - Panel de Control
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 1rem; font-weight: 500;">
          Gestión integral de pensionados, consumos y pagos en tiempo real.
        </p>
      </div>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <Button
          label="Consumo"
          icon="pi pi-check-circle"
          severity="success"
          raised
          @click="navegar('/consumos')"
        />
        <Button
          label="Pago"
          icon="pi pi-wallet"
          severity="info"
          raised
          @click="navegar('/pagos')"
        />
        <Button
          label="Venta Casual"
          icon="pi pi-shopping-cart"
          severity="warn"
          raised
          @click="navegar('/ventas-casuales')"
        />
      </div>
    </div>

    <!-- Cargando -->
    <div
      v-if="cargando"
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 50vh;
        gap: 1rem;
      "
    >
      <i class="pi pi-spin pi-spinner" style="font-size: 3rem; color: #3b82f6;"></i>
      <span style="font-weight: 600; color: #64748b;">Cargando información del dashboard...</span>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 2rem;">
      <!-- KPI Grid -->
      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        "
      >
        <!-- Card 1: Pensionados -->
        <div
          style="
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          "
          :style="hoverKpi === 0 ? 'transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08); border-color: #3b82f6;' : ''"
          @mouseover="hoverKpi = 0"
          @mouseleave="hoverKpi = null"
          @click="navegar('/pensionados')"
        >
          <div>
            <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Pensionados Activos</span>
            <h2 style="margin: 0.25rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #0f172a;">{{ resumen.pensionadosActivos }}</h2>
          </div>
          <div style="background: #dbeafe; color: #1d4ed8; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-users" style="font-size: 1.5rem;"></i>
          </div>
        </div>

        <!-- Card 2: Pensiones -->
        <div
          style="
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          "
          :style="hoverKpi === 1 ? 'transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08); border-color: #8b5cf6;' : ''"
          @mouseover="hoverKpi = 1"
          @mouseleave="hoverKpi = null"
          @click="navegar('/pensiones')"
        >
          <div>
            <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Pensiones Activas</span>
            <h2 style="margin: 0.25rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #0f172a;">{{ resumen.pensionesActivas }}</h2>
          </div>
          <div style="background: #f3e8ff; color: #6d28d9; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-calendar" style="font-size: 1.5rem;"></i>
          </div>
        </div>

        <!-- Card 3: Consumos -->
        <div
          style="
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          "
          :style="hoverKpi === 2 ? 'transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08); border-color: #10b981;' : ''"
          @mouseover="hoverKpi = 2"
          @mouseleave="hoverKpi = null"
          @click="navegar('/consumos')"
        >
          <div>
            <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Consumos Registrados</span>
            <h2 style="margin: 0.25rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #0f172a;">{{ resumen.consumosRegistrados }}</h2>
          </div>
          <div style="background: #d1fae5; color: #047857; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-check-circle" style="font-size: 1.5rem;"></i>
          </div>
        </div>

        <!-- Card 4: Ventas Casuales -->
        <div
          style="
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          "
          :style="hoverKpi === 3 ? 'transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08); border-color: #f59e0b;' : ''"
          @mouseover="hoverKpi = 3"
          @mouseleave="hoverKpi = null"
          @click="navegar('/ventas-casuales')"
        >
          <div>
            <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ventas Casuales</span>
            <h2 style="margin: 0.25rem 0 0 0; font-size: 2.2rem; font-weight: 800; color: #0f172a;">{{ resumen.ventasCasuales }}</h2>
          </div>
          <div style="background: #fef3c7; color: #b45309; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-shopping-bag" style="font-size: 1.5rem;"></i>
          </div>
        </div>
      </div>

      <!-- Layout Principal: Grilla Principal (70% - 30%) -->
      <div
        style="
          display: grid;
          grid-template-columns: 2.2fr 1fr;
          gap: 2rem;
        "
      >
        <!-- Columna de Contenido (Izquierda) -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Últimos Consumos -->
          <div
            style="
              background: white;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            "
          >
            <h3
              style="
                margin-top: 0;
                margin-bottom: 1.25rem;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.2rem;
                font-weight: 700;
              "
            >
              <i class="pi pi-clock" style="color: #3b82f6;"></i>
              Últimos Consumos Registrados
            </h3>

            <DataTable
              :value="ultimosConsumos"
              stripedRows
              class="p-datatable-sm"
              :rows="5"
              responsiveLayout="scroll"
            >
              <Column header="Pensionado">
                <template #body="slotProps">
                  <span style="font-weight: 600; color: #334155;">
                    {{ slotProps.data.pension?.pensionado?.nombreCompleto || 'Consumidor Casual' }}
                  </span>
                </template>
              </Column>
              
              <Column header="Opción Menú">
                <template #body="slotProps">
                  <span style="color: #475569;">
                    {{ slotProps.data.opcionMenu?.nombre || 'Menú Especial' }}
                  </span>
                </template>
              </Column>

              <Column field="tipoConsumo" header="Tipo">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.tipoConsumo"
                    :severity="getTipoConsumoSeverity(slotProps.data.tipoConsumo)"
                  />
                </template>
              </Column>

              <Column field="cantidadCompletos" header="Cantidad" style="text-align: center;">
                <template #body="slotProps">
                  <strong style="color: #0f172a;">{{ slotProps.data.cantidadCompletos }}</strong>
                </template>
              </Column>

              <Column header="Fecha / Hora">
                <template #body="slotProps">
                  <span style="font-size: 0.85rem; color: #64748b;">
                    {{ formatFecha(slotProps.data.fechaCreacion) }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </div>

          <!-- Estadísticas y Distribución -->
          <div
            style="
              background: white;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            "
          >
            <h3
              style="
                margin-top: 0;
                margin-bottom: 1.5rem;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.2rem;
                font-weight: 700;
              "
            >
              <i class="pi pi-chart-bar" style="color: #8b5cf6;"></i>
              Distribución de Servicios
            </h3>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
              <!-- Barra de Consumos de Pensionados -->
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem;">
                  <span style="font-weight: 600; color: #475569;">Consumos por Suscripción (Pensión)</span>
                  <span style="font-weight: 700; color: #3b82f6;">{{ getConsumosRatio() }}%</span>
                </div>
                <div style="height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <div
                    :style="`width: ${getConsumosRatio()}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; transition: width 1s ease;`"
                  ></div>
                </div>
                <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem; line-height: 1.4;">
                  Porcentaje de atenciones dedicadas a clientes regulares con un plan de pensión activo.
                </p>
              </div>

              <!-- Barra de Ventas Casuales -->
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.95rem;">
                  <span style="font-weight: 600; color: #475569;">Proporción de Ventas Casuales</span>
                  <span style="font-weight: 700; color: #f59e0b;">{{ getVentasCasualesRatio() }}%</span>
                </div>
                <div style="height: 10px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <div
                    :style="`width: ${getVentasCasualesRatio()}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 6px; transition: width 1s ease;`"
                  ></div>
                </div>
                <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem; line-height: 1.4;">
                  Porcentaje de ingresos / comidas vendidas en el mostrador a clientes casuales diarios.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Lateral (Derecha) -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Panel de Alertas -->
          <div
            style="
              background: white;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            "
          >
            <h3
              style="
                margin-top: 0;
                margin-bottom: 1rem;
                color: #ef4444;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.15rem;
                font-weight: 700;
              "
            >
              <i class="pi pi-exclamation-triangle" style="color: #ef4444;"></i>
              Pensiones por Agotarse
            </h3>

            <div
              v-if="alertas.length === 0"
              style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2.5rem 1rem;
                color: #94a3b8;
                text-align: center;
                gap: 0.5rem;
              "
            >
              <i class="pi pi-check-circle" style="font-size: 2.2rem; color: #10b981;"></i>
              <span style="font-size: 0.9rem; font-weight: 500;">¡Todo al día!<br />No hay pensiones con saldo bajo.</span>
            </div>

            <div v-else style="display: flex; flex-direction: column; gap: 1rem; max-height: 350px; overflow-y: auto;">
              <div
                v-for="alerta in alertas"
                :key="alerta.id"
                style="
                  border: 1px solid #fee2e2;
                  background: #fff5f5;
                  border-radius: 12px;
                  padding: 0.85rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                  position: relative;
                "
              >
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                  <span style="font-weight: 700; color: #991b1b; font-size: 0.9rem; line-height: 1.2;">
                    {{ alerta.pensionado?.nombreCompleto }}
                  </span>
                  <span
                    style="
                      font-weight: 800;
                      color: #dc2626;
                      font-size: 0.75rem;
                      background: #fee2e2;
                      padding: 0.15rem 0.4rem;
                      border-radius: 6px;
                      white-space: nowrap;
                    "
                  >
                    {{ alerta.completosDisponibles }} disp.
                  </span>
                </div>

                <!-- Barra de Progreso Personalizada -->
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div style="flex: 1; height: 6px; background: #fee2e2; border-radius: 3px; border: 1px solid #fca5a5; overflow: hidden;">
                    <div
                      :style="`width: ${(alerta.completosDisponibles / alerta.cantidadCompletos) * 100}%; height: 100%; background: #dc2626; border-radius: 3px;`"
                    ></div>
                  </div>
                  <span style="font-size: 0.75rem; color: #7f1d1d; font-weight: 600; white-space: nowrap;">
                    {{ alerta.completosDisponibles }}/{{ alerta.cantidadCompletos }}
                  </span>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
                  <Button
                    icon="pi pi-plus"
                    label="Renovar"
                    severity="danger"
                    size="small"
                    outlined
                    style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
                    @click="navegar('/pagos')"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Pagos Recientes -->
          <div
            style="
              background: white;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              padding: 1.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            "
          >
            <h3
              style="
                margin-top: 0;
                margin-bottom: 1.25rem;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.15rem;
                font-weight: 700;
              "
            >
              <i class="pi pi-dollar" style="color: #10b981;"></i>
              Pagos Recientes
            </h3>

            <div
              v-if="ultimosPagos.length === 0"
              style="
                padding: 2rem 1rem;
                color: #94a3b8;
                text-align: center;
                font-size: 0.9rem;
              "
            >
              No hay pagos registrados recientemente.
            </div>

            <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div
                v-for="pago in ultimosPagos"
                :key="pago.id"
                style="
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 1px solid #f1f5f9;
                  padding-bottom: 0.75rem;
                "
              >
                <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; width: 65%;">
                  <span
                    style="
                      font-weight: 600;
                      color: #334155;
                      font-size: 0.88rem;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                    "
                  >
                    {{ pago.pension?.pensionado?.nombreCompleto || 'Pensionado' }}
                  </span>
                  <span style="font-size: 0.72rem; color: #94a3b8;">
                    {{ formatFecha(pago.fechaPago) }}
                  </span>
                </div>
                <div style="font-weight: 750; color: #059669; font-size: 0.95rem; white-space: nowrap;">
                  ${{ formatDinero(pago.montoTotal) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>