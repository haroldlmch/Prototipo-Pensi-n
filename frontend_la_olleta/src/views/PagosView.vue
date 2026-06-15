<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';

import api from '../api/axios';

interface Pensionado {
  id: number;
  nombreCompleto: string;
}

interface Pension {
  id: number;
  fechaInicio: string;
  cantidadCompletos: number;
  pensionado?: Pensionado;
}

interface Pago {
  id: number;
  fechaPago: string;
  precioUnitario: number | string;
  montoTotal: number | string;
  pension?: Pension;
}

interface PensionOption extends Pension {
  descripcion: string;
}

const pagos = ref<Pago[]>([]);
const pensiones = ref<Pension[]>([]);
const busquedaPensionado = ref('');

const pagosFiltrados = computed(() => {
  if (!busquedaPensionado.value.trim()) return pagos.value;
  return pagos.value.filter((pago) =>
    (pago.pension?.pensionado?.nombreCompleto ?? '')
      .toLowerCase()
      .includes(busquedaPensionado.value.toLowerCase()),
  );
});

const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const pagoId = ref<number | null>(null);
const fechaPago = ref('');
const precioUnitario = ref<number | null>(null);
const montoTotal = ref<number | null>(null);
const idPension = ref<number | null>(null);

const pensionesOpciones = computed<PensionOption[]>(() =>
  pensiones.value
    .filter(
      (pension) =>
        pension.id === idPension.value ||
        !pagos.value.some((pago) => pago.pension?.id === pension.id),
    )
    .map((pension) => ({
      ...pension,
      descripcion: `${pension.pensionado?.nombreCompleto ?? 'Sin pensionado'} - Pensión #${pension.id}`,
    })),
);

const pensionSeleccionada = computed(() =>
  pensiones.value.find((pension) => pension.id === idPension.value),
);

const formularioValido = computed(
  () =>
    Boolean(fechaPago.value) &&
    idPension.value !== null &&
    precioUnitario.value !== null &&
    precioUnitario.value >= 0 &&
    montoTotal.value !== null &&
    montoTotal.value >= 0,
);

const obtenerMensajeError = (error: unknown) => {
  const posibleError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const mensaje = posibleError.response?.data?.message;

  if (Array.isArray(mensaje)) return mensaje.join('. ');
  return mensaje ?? 'No se pudo completar la operación.';
};

const obtenerFechaLocal = () => {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desplazamiento).toISOString().slice(0, 10);
};

const convertirFechaISO = (valor: string) =>
  new Date(`${valor}T00:00:00.000Z`).toISOString();

const precioPensionadoSugerido = ref<number | null>(null);

const cargarDatos = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const [pagosResponse, pensionesResponse, configResponse] = await Promise.all([
      api.get('/pagos'),
      api.get('/pensiones'),
      api.get('/configuracion'),
    ]);

    pagos.value = pagosResponse.data;
    pensiones.value = pensionesResponse.data;

    const config = Array.isArray(configResponse.data) ? configResponse.data[0] : configResponse.data;
    if (config) {
      precioPensionadoSugerido.value = Number(config.precioPensionado);
    }
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  pagoId.value = null;
  fechaPago.value = obtenerFechaLocal();
  precioUnitario.value = null;
  montoTotal.value = null;
  idPension.value = null;
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevoPago = () => {
  limpiarFormulario();
  if (precioPensionadoSugerido.value !== null) {
    precioUnitario.value = precioPensionadoSugerido.value;
  }
  visible.value = true;
};

const editarPago = (pago: Pago) => {
  pagoId.value = pago.id;
  fechaPago.value = pago.fechaPago.slice(0, 10);
  precioUnitario.value = Number(pago.precioUnitario);
  montoTotal.value = Number(pago.montoTotal);
  idPension.value = pago.pension?.id ?? null;
  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const guardarPago = async () => {
  if (!formularioValido.value) {
    errorMensaje.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  const payload = {
    fechaPago: convertirFechaISO(fechaPago.value),
    precioUnitario: Number(precioUnitario.value),
    montoTotal: Number(montoTotal.value),
    idPension: Number(idPension.value),
  };

  try {
    if (modoEdicion.value) {
      await api.patch(`/pagos/${pagoId.value}`, payload);
    } else {
      await api.post('/pagos', payload);
    }

    visible.value = false;
    limpiarFormulario();
    await cargarDatos();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este pago? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarPagoConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';
  try {
    await api.delete(`/pagos/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarDatos();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    eliminando.value = false;
  }
};

const formatearFecha = (fecha: string) => {
  if (!fecha) return '-';
  return new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC' }).format(
    new Date(fecha),
  );
};

const formatearMonto = (monto: number | string) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(Number(monto));

const obtenerNombrePensionado = (pago: Pago) =>
  pago.pension?.pensionado?.nombreCompleto ??
  pensiones.value.find((pension) => pension.id === pago.pension?.id)?.pensionado
    ?.nombreCompleto ??
  'No disponible';

watch([precioUnitario, idPension], () => {
  if (modoEdicion.value) return;

  if (precioUnitario.value === null || !pensionSeleccionada.value) {
    montoTotal.value = null;
    return;
  }

  montoTotal.value =
    precioUnitario.value * pensionSeleccionada.value.cantidadCompletos;
});

onMounted(cargarDatos);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Pagos
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Registro y facturación de cuotas de pensiones de los beneficiarios.
        </p>
      </div>

      <Button
        label="Nuevo Pago"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoPago"
      />
    </div>

    <Message
      v-if="errorMensaje && !visible"
      severity="error"
      :closable="false"
      class="mensaje"
    >
      {{ errorMensaje }}
    </Message>

    <!-- Buscador -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="pi pi-search" style="color: #94a3b8;"></i>
        <InputText
          v-model="busquedaPensionado"
          placeholder="Buscar por nombre de pensionado..."
          style="padding: 0.75rem 1rem; flex: 1;"
          fluid
        />
      </div>
    </div>

    <!-- Tabla Principal -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <DataTable
        :value="pagosFiltrados"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay pagos registrados"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column header="Pensionado" style="font-weight: 600; color: #334155;">
          <template #body="slotProps">
            {{ obtenerNombrePensionado(slotProps.data) }}
          </template>
        </Column>

        <Column header="Pensión Asociada" style="width: 140px;">
          <template #body="slotProps">
            <span style="font-weight: 700; color: #475569;">
              Pensión #{{ slotProps.data.pension?.id ?? '-' }}
            </span>
          </template>
        </Column>

        <Column header="Fecha de Pago" style="color: #475569; width: 140px;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fechaPago) }}
          </template>
        </Column>

        <Column header="Precio Unitario" style="width: 150px; text-align: right;">
          <template #body="slotProps">
            {{ formatearMonto(slotProps.data.precioUnitario) }}
          </template>
        </Column>

        <Column header="Monto Total Recibido" style="width: 180px; text-align: right;">
          <template #body="slotProps">
            <span style="font-weight: 800; color: #059669; font-size: 1rem;">
              {{ formatearMonto(slotProps.data.montoTotal) }}
            </span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 140px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              aria-label="Editar pago"
              style="margin-right: .25rem;"
              @click="editarPago(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar pago"
              @click="confirmarEliminar(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Formulario -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Pago' : 'Nuevo Pago'"
      :style="{ width: '480px' }"
    >
      <div class="formulario">
        <Message
          v-if="errorMensaje"
          severity="error"
          :closable="false"
          style="margin-bottom: 0.5rem;"
        >
          {{ errorMensaje }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensión</label>
          <Select
            v-model="idPension"
            :options="pensionesOpciones"
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione una pensión"
            :disabled="modoEdicion"
            fluid
          />
          <small v-if="pensionSeleccionada" style="color: #3b82f6; font-weight: 600; margin-top: 0.1rem;">
            * Incluye un total de {{ pensionSeleccionada.cantidadCompletos }} completos.
          </small>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha de Pago</label>
          <input
            v-model="fechaPago"
            type="date"
            class="input-fecha-custom"
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
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

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Monto Total</label>
            <InputNumber
              v-model="montoTotal"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>
        </div>

        <Button
          label="Guardar Registro de Pago"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarPago"
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
            @click="eliminarPagoConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.input-fecha-custom {
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
}

.input-fecha-custom:focus {
  border-color: #3b82f6;
}
</style>
