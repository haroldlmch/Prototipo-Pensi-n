<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';

import api from '../api/axios';

const pensiones = ref<any[]>([]);
const pensionados = ref<any[]>([]);
const busquedaPensionado = ref('');

const pensioneFiltradas = computed(() => {
  if (!busquedaPensionado.value.trim()) return pensiones.value;
  return pensiones.value.filter((pension) =>
    pension.pensionado?.nombreCompleto?.toLowerCase().includes(busquedaPensionado.value.toLowerCase()) || false,
  );
});

const pensionadosFiltrados = computed(() => {
  return pensionados.value;
});

const visible = ref(false);

const modoEdicion = ref(false);
const pensionId = ref<number | null>(null);

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const fechaInicio = ref('');
const cantidadCompletos = ref('');
const completosDisponibles = ref('');
const estado = ref('ACTIVA');
const idPensionado = ref<number | null>(null);

// Lógica de Renovación y Traspaso de Saldo
const idPensionAnterior = ref<number | null>(null);
const saldoRestanteAnterior = ref<number>(0);
const traspasarSaldo = ref<boolean>(true);

const verificarSaldoPensionAnterior = () => {
  if (modoEdicion.value || !idPensionado.value) {
    if (!idPensionAnterior.value) {
      saldoRestanteAnterior.value = 0;
    }
    return;
  }

  // Si ya tenemos una pensión anterior fijada (ej. al pulsar Renovar), buscar esa pensión específica
  if (idPensionAnterior.value) {
    const pAnt = pensiones.value.find((p) => Number(p.id) === Number(idPensionAnterior.value));
    if (pAnt) {
      saldoRestanteAnterior.value = Number(pAnt.completosDisponibles) || 0;
      actualizarDisponibles();
      return;
    }
  }

  // Buscar cualquier pensión del pensionado que tenga saldo disponible > 0
  const pensionConSaldo = pensiones.value.find(
    (p) =>
      Number(p.pensionado?.id) === Number(idPensionado.value) &&
      Number(p.completosDisponibles) > 0,
  );

  if (pensionConSaldo) {
    idPensionAnterior.value = pensionConSaldo.id;
    saldoRestanteAnterior.value = Number(pensionConSaldo.completosDisponibles) || 0;
    traspasarSaldo.value = true;
  } else {
    idPensionAnterior.value = null;
    saldoRestanteAnterior.value = 0;
  }
  actualizarDisponibles();
};

const actualizarDisponibles = () => {
  if (modoEdicion.value) return;
  const comprados = Number(cantidadCompletos.value) || 0;
  const extra = (traspasarSaldo.value && saldoRestanteAnterior.value > 0) ? Number(saldoRestanteAnterior.value) : 0;
  completosDisponibles.value = String(comprados + extra);
};

const cargarPensiones = async () => {
  try {
    const response = await api.get('/pensiones');
    pensiones.value = response.data;
    
    // Actualizar automáticamente a AGOTADA si completosDisponibles es 0
    for (const pension of pensiones.value) {
      if (pension.completosDisponibles === 0 && pension.estado !== 'AGOTADA') {
        try {
          const payload = {
            fechaInicio: pension.fechaInicio,
            cantidadCompletos: pension.cantidadCompletos,
            completosDisponibles: pension.completosDisponibles,
            estado: 'AGOTADA',
            idPensionado: pension.pensionado?.id || pension.idPensionado,
          };
          await api.patch(`/pensiones/${pension.id}`, payload);
          pension.estado = 'AGOTADA';
        } catch (error) {
          console.error(`Error al actualizar pensión ${pension.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const cargarPensionados = async () => {
  try {
    const response = await api.get('/pensionados');
    pensionados.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const limpiarFormulario = () => {
  pensionId.value = null;

  fechaInicio.value = obtenerFechaLocal();
  cantidadCompletos.value = '8';
  completosDisponibles.value = '8';
  estado.value = 'ACTIVA';
  idPensionado.value = null;
  idPensionAnterior.value = null;
  saldoRestanteAnterior.value = 0;
  traspasarSaldo.value = true;

  modoEdicion.value = false;
};

const nuevaPension = () => {
  limpiarFormulario();
  visible.value = true;
};

const renovarPension = (pension: any) => {
  limpiarFormulario();
  idPensionAnterior.value = Number(pension.id);
  saldoRestanteAnterior.value = Number(pension.completosDisponibles) || 0;
  idPensionado.value = Number(pension.pensionado?.id || pension.idPensionado);
  fechaInicio.value = obtenerFechaLocal();
  cantidadCompletos.value = '8';
  traspasarSaldo.value = true;
  actualizarDisponibles();
  visible.value = true;
};

const editarPension = (pension: any) => {
  pensionId.value = pension.id;

  // Extract date part only (yyyy-MM-dd)
  fechaInicio.value = pension.fechaInicio ? pension.fechaInicio.slice(0, 10) : '';

  cantidadCompletos.value =
    String(pension.cantidadCompletos);

  completosDisponibles.value =
    String(pension.completosDisponibles);

  estado.value =
    pension.estado;

  idPensionado.value =
    pension.pensionado?.id;

  idPensionAnterior.value = null;
  saldoRestanteAnterior.value = 0;
  modoEdicion.value = true;
  visible.value = true;
};

const guardarPension = async () => {
  try {
    const comprados = Number(cantidadCompletos.value) || 0;
    const saldoExtra = (!modoEdicion.value && traspasarSaldo.value && saldoRestanteAnterior.value > 0)
      ? Number(saldoRestanteAnterior.value)
      : 0;

    const totalPlatosPaquete = comprados + saldoExtra;
    const disponiblesCalculados = modoEdicion.value
      ? Number(completosDisponibles.value)
      : totalPlatosPaquete;

    const payload = {
      fechaInicio: fechaInicio.value.slice(0, 10),
      cantidadCompletos: totalPlatosPaquete,
      completosDisponibles: disponiblesCalculados,
      estado: estado.value,
      idPensionado: Number(idPensionado.value),
      idPensionAnterior: (!modoEdicion.value && traspasarSaldo.value && idPensionAnterior.value) ? Number(idPensionAnterior.value) : undefined,
    };

    let response;
    if (modoEdicion.value) {
      response = await api.patch(
        `/pensiones/${pensionId.value}`,
        payload,
      );
    } else {
      response = await api.post(
        '/pensiones',
        payload,
      );
    }

    const pensionGuardada = response.data;
    visible.value = false;

    if (!modoEdicion.value) {
      const pensionadoObj = pensionados.value.find((p) => p.id === payload.idPensionado);
      pensionSeleccionadaParaPago.value = {
        ...pensionGuardada,
        pensionado: pensionadoObj,
      };
      idPensionPago.value = pensionGuardada.id;
      fechaPago.value = obtenerFechaLocal();
      precioUnitario.value = precioPensionadoSugerido.value;
      // Cobrar solo los platos que compra hoy (8)
      cantidadCompletosPago.value = comprados;
      montoTotal.value = (precioUnitario.value ?? 0) * comprados;
      errorMensajePago.value = '';
      visiblePago.value = true;
    }

    limpiarFormulario();
    await cargarPensiones();

  } catch (error) {
    console.error(error);
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar esta pensión? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarPensionConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/pensiones/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarPensiones();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
  }
};

const getEstadoSeverity = (estadoStr: string) => {
  switch (estadoStr?.toUpperCase()) {
    case 'ACTIVA':
      return 'success';
    case 'AGOTADA':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getProgresoColor = (disp: number, cant: number) => {
  const ratio = cant > 0 ? disp / cant : 0;
  if (ratio <= 0.2) return '#dc2626'; // Rojo
  if (ratio <= 0.5) return '#f59e0b'; // Amarillo/Naranja
  return '#10b981'; // Verde
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const dateOnly = fechaStr.slice(0, 10);
  const [y, m, d] = dateOnly.split('-');
  if (!y || !m || !d) return fechaStr;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('es-ES');
};

watch(idPensionado, () => {
  verificarSaldoPensionAnterior();
});

watch([cantidadCompletos, traspasarSaldo, saldoRestanteAnterior], () => {
  actualizarDisponibles();
});

// Modal Recarga Rápida de Platos
const visibleRecarga = ref(false);
const pensionRecarga = ref<any>(null);
const platosAAgregar = ref(8);
const guardandoRecarga = ref(false);
const errorMensajeRecarga = ref('');

const abrirModalRecarga = (pension: any) => {
  pensionRecarga.value = pension;
  platosAAgregar.value = 8;
  errorMensajeRecarga.value = '';
  visibleRecarga.value = true;
};

const guardarRecargaPlatos = async () => {
  if (!pensionRecarga.value?.id) return;
  const cant = Number(platosAAgregar.value);
  if (!cant || cant <= 0) {
    errorMensajeRecarga.value = 'Ingrese una cantidad de platos válida';
    return;
  }

  guardandoRecarga.value = true;
  errorMensajeRecarga.value = '';

  try {
    const p = pensionRecarga.value;
    const nuevoDisponibles = Number(p.completosDisponibles) + cant;
    const nuevoTotal = nuevoDisponibles; // El paquete activo queda con 8 platos (1 saldo + 7 nuevos)
    const hoyStr = obtenerFechaLocal();

    // 1. Actualizar la pensión
    await api.patch(`/pensiones/${p.id}`, {
      cantidadCompletos: nuevoTotal,
      completosDisponibles: nuevoDisponibles,
      estado: 'ACTIVA',
      idPensionado: p.pensionado?.id || p.idPensionado,
    });

    // 2. Registrar el pago de los platos agregados
    const precio = precioPensionadoSugerido.value || 15;
    await api.post('/pagos', {
      idPension: p.id,
      fechaPago: hoyStr,
      precioUnitario: precio,
      montoTotal: cant * precio,
      cantidadCompletos: cant,
    });

    visibleRecarga.value = false;
    await cargarPensiones();
  } catch (error: any) {
    errorMensajeRecarga.value = error.response?.data?.message || 'Error al agregar platos a la pensión';
  } finally {
    guardandoRecarga.value = false;
  }
};

const abrirModalPagoDirecto = (pension: any) => {
  pensionSeleccionadaParaPago.value = pension;
  idPensionPago.value = pension.id;
  cantidadCompletosPago.value = pension.cantidadCompletos;
  fechaPago.value = obtenerFechaLocal();
  precioUnitario.value = precioPensionadoSugerido.value;
  montoTotal.value = (precioUnitario.value ?? 0) * (cantidadCompletosPago.value ?? 0);
  errorMensajePago.value = '';
  visiblePago.value = true;
};

// Estado para el diálogo de registro de pago
const visiblePago = ref(false);
const guardandoPago = ref(false);
const errorMensajePago = ref('');

const fechaPago = ref('');
const precioUnitario = ref<number | null>(null);
const cantidadCompletosPago = ref<number | null>(null);
const montoTotal = ref<number | null>(null);
const idPensionPago = ref<number | null>(null);
const pensionSeleccionadaParaPago = ref<any>(null);

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formularioPagoValido = computed(
  () =>
    Boolean(fechaPago.value) &&
    idPensionPago.value !== null &&
    precioUnitario.value !== null &&
    precioUnitario.value >= 0 &&
    cantidadCompletosPago.value !== null &&
    cantidadCompletosPago.value >= 1 &&
    montoTotal.value !== null &&
    montoTotal.value >= 0,
);

const guardarPago = async () => {
  if (!formularioPagoValido.value) {
    errorMensajePago.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardandoPago.value = true;
  errorMensajePago.value = '';

  const payload = {
    fechaPago: fechaPago.value.slice(0, 10),
    precioUnitario: Number(precioUnitario.value),
    montoTotal: Number(montoTotal.value),
    idPension: Number(idPensionPago.value),
    cantidadCompletos: Number(cantidadCompletosPago.value) || undefined,
  };

  try {
    await api.post('/pagos', payload);
    visiblePago.value = false;
    await cargarPensiones();
  } catch (error) {
    console.error(error);
    const posibleError = error as {
      response?: { data?: { message?: string | string[] } };
    };
    const mensaje = posibleError.response?.data?.message;
    errorMensajePago.value = Array.isArray(mensaje)
      ? mensaje.join('. ')
      : (mensaje ?? 'No se pudo registrar el pago.');
  } finally {
    guardandoPago.value = false;
  }
};

const precioPensionadoSugerido = ref<number | null>(null);

const cargarConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion');
    const config = Array.isArray(response.data) ? response.data[0] : response.data;
    if (config) {
      precioPensionadoSugerido.value = Number(config.precioPensionado);
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
};

onMounted(async () => {
  await Promise.all([cargarPensiones(), cargarPensionados(), cargarConfiguracion()]);
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Gestión de Pensiones
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Control de planes de comida, saldos de platos y renovaciones de pensionados.
        </p>
      </div>

      <Button
        label="Nueva Pensión"
        icon="pi pi-plus"
        style="background: #f97316; border-color: #f97316; color: white; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.25rem; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);"
        @click="nuevaPension"
      />
    </div>

    <!-- Buscador -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="pi pi-search" style="color: #94a3b8;"></i>
        <InputText
          v-model="busquedaPensionado"
          placeholder="Buscar pensión por nombre del pensionado..."
          style="flex: 1; border: none; font-size: 0.95rem;"
        />
      </div>
    </div>

    <!-- Tabla de Pensiones -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <DataTable
        :value="pensioneFiltradas"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay pensiones registradas"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column header="ID" style="width: 70px; color: #64748b; font-weight: 700;">
          <template #body="slotProps">
            #{{ slotProps.data.id }}
          </template>
        </Column>

        <Column
          field="pensionado.nombreCompleto"
          header="Pensionado"
          style="font-weight: 700; color: #0f172a;"
        />

        <Column header="Fecha Inicio" style="width: 140px; color: #475569;">
          <template #body="slotProps">
            {{ formatFecha(slotProps.data.fechaInicio) }}
          </template>
        </Column>

        <Column
          field="cantidadCompletos"
          header="Total Comprados"
          style="width: 140px; text-align: center;"
        />

        <Column
          header="Completos Disponibles"
          style="width: 200px;"
        >
          <template #body="slotProps">
            <div style="display: flex; flex-direction: column; gap: 0.3rem;">
              <span style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">
                {{ slotProps.data.completosDisponibles }} de {{ slotProps.data.cantidadCompletos }}
              </span>
              <div style="height: 6px; background: #f1f5f9; border-radius: 3px; border: 1px solid #e2e8f0; overflow: hidden; width: 100%;">
                <div
                  :style="`width: ${(slotProps.data.completosDisponibles / slotProps.data.cantidadCompletos) * 100}%; height: 100%; background-color: ${getProgresoColor(slotProps.data.completosDisponibles, slotProps.data.cantidadCompletos)};`"
                ></div>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="estado"
          header="Estado"
          style="width: 130px;"
        >
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.estado"
              :severity="getEstadoSeverity(slotProps.data.estado)"
            />
          </template>
        </Column>

        <Column header="Acciones" style="width: 150px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-refresh"
              severity="info"
              text
              rounded
              title="Renovar Pensión (Acumular saldo restante)"
              style="margin-right: .25rem"
              @click="renovarPension(slotProps.data)"
            />

            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              title="Editar Pensión"
              style="margin-right: .25rem"
              @click="editarPension(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              title="Eliminar Pensión"
              @click="confirmarEliminar(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Creación / Edición -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Pensión'
          : idPensionAnterior
          ? '🔄 Renovar Pensión / Acumular Saldo'
          : 'Nueva Pensión'
      "
      :style="{ width: '540px' }"
    >
      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 0.5rem 0.25rem 0 0.25rem;
          box-sizing: border-box;
        "
      >
        <!-- Selección de Pensionado -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Pensionado *</label>
          <Select
            v-model="idPensionado"
            :options="pensionadosFiltrados"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Seleccione un pensionado"
            :disabled="modoEdicion"
            fluid
          />
        </div>

        <!-- Alerta de Saldo Remanente para Traspasar -->
        <div
          v-if="!modoEdicion && saldoRestanteAnterior > 0"
          style="
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            border-radius: 12px;
            padding: 0.85rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          "
        >
          <div style="display: flex; align-items: center; gap: 0.5rem; color: #166534; font-weight: 700; font-size: 0.88rem;">
            <i class="pi pi-info-circle"></i>
            <span>Pensión Anterior con Saldo (#{{ idPensionAnterior }})</span>
          </div>
          <p style="margin: 0; font-size: 0.82rem; color: #15803d; line-height: 1.4;">
            El cliente tiene <strong>{{ saldoRestanteAnterior }} almuerzo(s)</strong> restante(s). Se cerrará la pensión anterior y se sumarán a la nueva.
          </p>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-top: 0.2rem;">
            <Checkbox v-model="traspasarSaldo" :binary="true" inputId="checkTraspaso" />
            <label for="checkTraspaso" style="font-size: 0.85rem; font-weight: 700; color: #14532d; cursor: pointer;">
              Traspasar y sumar {{ saldoRestanteAnterior }} plato(s) a la nueva pensión
            </label>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Fecha Inicio</label>
          <input
            v-model="fechaInicio"
            type="date"
            style="
              width: 100%;
              padding: 0.75rem 1rem;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              font-family: inherit;
              box-sizing: border-box;
            "
          />
        </div>

        <!-- Fila de Cantidad de Platos y Total Disponibles -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; box-sizing: border-box;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem; min-width: 0;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">
              {{ modoEdicion ? 'Total de Platos' : (idPensionAnterior ? 'Cantidad de Platos a Renovar *' : 'Cantidad de Platos a Adquirir *') }}
            </label>
            <InputText
              v-model="cantidadCompletos"
              placeholder="Ej. 7"
              fluid
              style="padding: 0.75rem 1rem; width: 100%; box-sizing: border-box;"
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem; min-width: 0;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Total Disponibles</label>
            <InputText
              v-model="completosDisponibles"
              placeholder="Ej. 8"
              fluid
              style="padding: 0.75rem 1rem; font-weight: 800; color: #059669; background: #f8fafc; width: 100%; box-sizing: border-box;"
              :disabled="!modoEdicion"
            />
          </div>
        </div>

        <!-- Resumen explicativo -->
        <div
          v-if="!modoEdicion"
          style="
            background: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 10px;
            padding: 0.85rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
          "
        >
          <span style="color: #9a3412; font-weight: 600;">
            {{ idPensionAnterior ? 'A renovar' : 'Comprados' }}: <strong>{{ cantidadCompletos || 0 }}</strong> + Saldo anterior: <strong>{{ (traspasarSaldo && saldoRestanteAnterior > 0) ? saldoRestanteAnterior : 0 }}</strong>
          </span>
          <span style="color: #c2410c; font-weight: 800; font-size: 0.95rem;">
            = {{ completosDisponibles }} platos disponibles
          </span>
        </div>

        <div v-if="modoEdicion" style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Estado</label>
          <Select
            v-model="estado"
            :options="['ACTIVA', 'AGOTADA']"
            placeholder="Estado de la pensión"
            fluid
          />
        </div>

        <Button
          :label="modoEdicion ? 'Guardar Cambios' : 'Guardar y Registrar Pago'"
          :icon="modoEdicion ? 'pi pi-save' : 'pi pi-credit-card'"
          severity="success"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 700;"
          fluid
          @click="guardarPension"
        />
      </div>
    </Dialog>

    <!-- Dialogo de Confirmación de Eliminación -->
    <Dialog
      v-model:visible="mostrarConfirmarEliminar"
      modal
      header="Confirmar Eliminación"
      :style="{ width: '400px' }"
      :closable="false"
    >
      <div style="display: flex; flex-direction: column; gap: 1.5rem; align-items: center; text-align: center; padding-top: 0.5rem;">
        <div style="background: #fee2e2; color: #dc2626; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-exclamation-triangle" style="font-size: 1.75rem;"></i>
        </div>
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.15rem; font-weight: 700; color: #1e293b;">
            ¿Estás seguro?
          </h3>
          <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
            {{ mensajeEliminar }}
          </p>
        </div>
        <div style="display: flex; gap: 1rem; width: 100%; margin-top: 0.5rem;">
          <Button
            label="Cancelar"
            severity="secondary"
            text
            style="flex: 1; padding: 0.75rem;"
            @click="mostrarConfirmarEliminar = false"
          />
          <Button
            label="Eliminar"
            severity="danger"
            style="flex: 1; padding: 0.75rem;"
            :loading="eliminando"
            @click="eliminarPensionConfirmado"
          />
        </div>
      </div>
    </Dialog>

    <!-- Dialogo de Registro de Pago (después de nueva pensión) -->
    <Dialog
      v-model:visible="visiblePago"
      modal
      header="Registrar Pago de Pensión"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message
          v-if="errorMensajePago"
          severity="error"
          :closable="false"
          style="margin-bottom: 0.5rem;"
        >
          {{ errorMensajePago }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensión</label>
          <InputText
            :value="pensionSeleccionadaParaPago ? `${pensionSeleccionadaParaPago.pensionado?.nombreCompleto || 'Pensionado'} - Pensión #${pensionSeleccionadaParaPago.id}` : ''"
            disabled
            style="padding: 0.75rem 1rem;"
          />
          <small v-if="pensionSeleccionadaParaPago" style="color: #3b82f6; font-weight: 600; margin-top: 0.1rem;">
            * Incluye un total de {{ pensionSeleccionadaParaPago.cantidadCompletos }} completos.
          </small>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha de Pago</label>
          <input
            v-model="fechaPago"
            type="date"
            style="
              width: 100%;
              box-sizing: border-box;
              padding: 0.75rem 1rem;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              font-family: inherit;
              font-size: 0.95rem;
              color: #334155;
              outline: none;
              transition: border-color 0.2s ease;
            "
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Platos a Recargar</label>
            <InputNumber
              v-model="cantidadCompletosPago"
              :min="1"
              showButtons
              placeholder="Ej. 15"
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Precio por Completo</label>
            <InputNumber
              v-model="precioUnitario"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Monto Total a Cobrar</label>
          <InputNumber
            v-model="montoTotal"
            mode="currency"
            currency="BOB"
            locale="es-BO"
            :min="0"
            fluid
          />
        </div>

        <Button
          label="Guardar Registro de Pago"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardandoPago"
          :disabled="!formularioPagoValido"
          fluid
          @click="guardarPago"
        />
      </div>
    </Dialog>

    <!-- Dialogo Recargar Platos a Pensión Existente -->
    <Dialog
      v-model:visible="visibleRecarga"
      modal
      :header="`➕ Agregar Platos a la Pensión #${pensionRecarga?.id || ''}`"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensajeRecarga" severity="error" :closable="false">
          {{ errorMensajeRecarga }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
          <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">Pensionado</span>
          <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a;">
            {{ pensionRecarga?.pensionado?.nombreCompleto || 'Pensionado' }}
          </div>
        </div>

        <div
          style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div>
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Saldo Actual Restante</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #0284c7;">
              {{ pensionRecarga?.completosDisponibles || 0 }} platos
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Total Comprados Histórico</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #475569;">
              {{ pensionRecarga?.cantidadCompletos || 0 }} platos
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">¿Cuántos platos desea agregar hoy? *</label>
          <InputNumber
            v-model="platosAAgregar"
            :min="1"
            :max="100"
            showButtons
            fluid
          />
        </div>

        <!-- Resumen de Nuevo Saldo -->
        <div
          style="
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 1.5px solid #86efac;
            border-radius: 12px;
            padding: 0.85rem 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div>
            <div style="font-size: 0.82rem; color: #166534; font-weight: 700; text-transform: uppercase;">
              Nuevo Saldo: {{ (Number(pensionRecarga?.completosDisponibles || 0) + Number(platosAAgregar || 0)) }} platos
            </div>
            <div style="font-size: 0.75rem; color: #15803d; margin-top: 0.1rem;">
              {{ platosAAgregar }} platos x Bs. {{ Number(precioPensionadoSugerido || 15).toFixed(2) }}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: #166534; font-weight: 600;">Total a Cobrar:</div>
            <div style="font-size: 1.4rem; font-weight: 900; color: #14532d;">
              Bs. {{ (Number(platosAAgregar || 0) * Number(precioPensionadoSugerido || 15)).toFixed(2) }}
            </div>
          </div>
        </div>

        <Button
          :label="`Guardar y Cobrar (Bs. ${(Number(platosAAgregar || 0) * Number(precioPensionadoSugerido || 15)).toFixed(2)})`"
          icon="pi pi-check"
          severity="success"
          :loading="guardandoRecarga"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 700;"
          fluid
          @click="guardarRecargaPlatos"
        />
      </div>
    </Dialog>
  </div>
</template>