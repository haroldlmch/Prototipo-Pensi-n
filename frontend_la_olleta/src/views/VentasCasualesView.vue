<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';

import api from '../api/axios';

interface VentaCasual {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  precioUnitario: number | string;
  montoTotal: number | string;
}

const ventas = ref<VentaCasual[]>([]);

const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const ventaId = ref<number | null>(null);
const fecha = ref('');
const cantidadCompletos = ref<number | null>(1);
const precioUnitario = ref<number | null>(null);
const montoTotal = ref<number | null>(null);

const formularioValido = computed(
  () =>
    Boolean(fecha.value) &&
    cantidadCompletos.value !== null &&
    cantidadCompletos.value >= 1 &&
    precioUnitario.value !== null &&
    precioUnitario.value >= 0 &&
    montoTotal.value !== null &&
    montoTotal.value >= 0,
);

const totalVentas = computed(() =>
  ventas.value.reduce((total, venta) => total + Number(venta.montoTotal), 0),
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
  const actual = new Date();
  const desplazamiento = actual.getTimezoneOffset() * 60_000;
  return new Date(actual.getTime() - desplazamiento).toISOString().slice(0, 10);
};

const convertirFechaISO = (valor: string) =>
  new Date(`${valor}T00:00:00.000Z`).toISOString();

const cargarVentas = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const response = await api.get('/ventas-casuales');
    ventas.value = response.data;
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  ventaId.value = null;
  fecha.value = obtenerFechaLocal();
  cantidadCompletos.value = 1;
  precioUnitario.value = null;
  montoTotal.value = null;
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevaVenta = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarVenta = (venta: VentaCasual) => {
  ventaId.value = venta.id;
  fecha.value = venta.fecha.slice(0, 10);
  cantidadCompletos.value = venta.cantidadCompletos;
  precioUnitario.value = Number(venta.precioUnitario);
  montoTotal.value = Number(venta.montoTotal);
  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const guardarVenta = async () => {
  if (!formularioValido.value) {
    errorMensaje.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  const payload = {
    fecha: convertirFechaISO(fecha.value),
    cantidadCompletos: Number(cantidadCompletos.value),
    precioUnitario: Number(precioUnitario.value),
    montoTotal: Number(montoTotal.value),
  };

  try {
    if (modoEdicion.value) {
      await api.patch(`/ventas-casuales/${ventaId.value}`, payload);
    } else {
      await api.post('/ventas-casuales', payload);
    }

    visible.value = false;
    limpiarFormulario();
    await cargarVentas();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este registro de venta casual? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarVentaConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';
  try {
    await api.delete(`/ventas-casuales/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarVentas();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    eliminando.value = false;
  }
};

const formatearFecha = (valor: string) => {
  if (!valor) return '-';
  return new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC' }).format(
    new Date(valor),
  );
};

const formatearMonto = (monto: number | string) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(Number(monto));

watch([cantidadCompletos, precioUnitario], () => {
  if (cantidadCompletos.value === null || precioUnitario.value === null) {
    montoTotal.value = null;
    return;
  }

  montoTotal.value = cantidadCompletos.value * precioUnitario.value;
});

onMounted(cargarVentas);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Ventas Casuales
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Registro de comidas despachadas directamente en el mostrador a clientes casuales.
        </p>
      </div>

      <Button
        label="Nueva Venta"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevaVenta"
      />
    </div>

    <!-- Indicador de total registrado -->
    <div class="resumen-card">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="background: #d1fae5; color: #059669; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-money-bill" style="font-size: 1.35rem;"></i>
        </div>
        <div>
          <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Registrado</span>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #059669;">
            {{ formatearMonto(totalVentas) }}
          </h2>
        </div>
      </div>
    </div>

    <Message
      v-if="errorMensaje && !visible"
      severity="error"
      :closable="false"
      class="mensaje"
    >
      {{ errorMensaje }}
    </Message>

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
        :value="ventas"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay ventas casuales registradas"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column header="Fecha" style="color: #475569; font-weight: 600;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column
          field="cantidadCompletos"
          header="Completos Vendidos"
          style="width: 150px; text-align: center; font-weight: 700; color: #0f172a;"
        />

        <Column header="Precio Unitario" style="width: 150px; text-align: right;">
          <template #body="slotProps">
            {{ formatearMonto(slotProps.data.precioUnitario) }}
          </template>
        </Column>

        <Column header="Monto Total" style="width: 180px; text-align: right;">
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
              aria-label="Editar venta casual"
              style="margin-right: .25rem;"
              @click="editarVenta(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar venta casual"
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
      :header="modoEdicion ? 'Editar Venta Casual' : 'Nueva Venta Casual'"
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha</label>
          <input
            v-model="fecha"
            type="date"
            class="input-fecha-custom"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Cantidad de Completos</label>
          <InputNumber
            v-model="cantidadCompletos"
            :min="1"
            showButtons
            fluid
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Precio Unitario</label>
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
          label="Guardar Registro de Venta"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarVenta"
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
            @click="eliminarVentaConfirmado"
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

.resumen-card {
  max-width: 320px;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
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
