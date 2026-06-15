<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

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
  nombreCompleto: string;
}

interface Pension {
  id: number;
  estado: string;
  pensionado?: Pensionado;
}

interface Extra {
  id: number;
  fecha: string;
  descripcion: string;
  precio: number | string;
  pension?: Pension;
}

const extras = ref<Extra[]>([]);
const pensiones = ref<Pension[]>([]);

const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const extraId = ref<number | null>(null);
const fecha = ref('');
const descripcion = ref('');
const precio = ref<number | null>(null);
const idPension = ref<number | null>(null);

const pensionesOpciones = computed(() =>
  pensiones.value.map((pension) => ({
    ...pension,
    descripcion: `${pension.pensionado?.nombreCompleto ?? 'Sin pensionado'} - Pensión #${pension.id}`,
  })),
);

const formularioValido = computed(
  () =>
    Boolean(fecha.value) &&
    Boolean(descripcion.value.trim()) &&
    descripcion.value.trim().length <= 200 &&
    precio.value !== null &&
    precio.value >= 0 &&
    idPension.value !== null,
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

const cargarDatos = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const [extrasResponse, pensionesResponse] = await Promise.all([
      api.get('/extras'),
      api.get('/pensiones'),
    ]);

    extras.value = extrasResponse.data;
    pensiones.value = pensionesResponse.data;
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  extraId.value = null;
  fecha.value = obtenerFechaLocal();
  descripcion.value = '';
  precio.value = null;
  idPension.value = null;
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevoExtra = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarExtra = (extra: Extra) => {
  extraId.value = extra.id;
  fecha.value = extra.fecha.slice(0, 10);
  descripcion.value = extra.descripcion;
  precio.value = Number(extra.precio);
  idPension.value = extra.pension?.id ?? null;
  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const guardarExtra = async () => {
  if (!formularioValido.value) {
    errorMensaje.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  const payload = {
    fecha: convertirFechaISO(fecha.value),
    descripcion: descripcion.value.trim(),
    precio: Number(precio.value),
    idPension: Number(idPension.value),
  };

  try {
    if (modoEdicion.value) {
      await api.patch(`/extras/${extraId.value}`, payload);
    } else {
      await api.post('/extras', payload);
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

const eliminarExtra = async (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este extra? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarExtraConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';

  try {
    await api.delete(`/extras/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarDatos();
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

const obtenerNombrePensionado = (extra: Extra) =>
  extra.pension?.pensionado?.nombreCompleto ??
  pensiones.value.find((pension) => pension.id === extra.pension?.id)
    ?.pensionado?.nombreCompleto ??
  'No disponible';

onMounted(cargarDatos);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Extras
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Consumos adicionales solicitados por los clientes (refrescos, postres, extras).
        </p>
      </div>

      <Button
        label="Nuevo Extra"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoExtra"
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
        :value="extras"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay extras registrados"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column header="Pensionado" style="font-weight: 600; color: #334155;">
          <template #body="slotProps">
            {{ obtenerNombrePensionado(slotProps.data) }}
          </template>
        </Column>

        <Column header="Pensión" style="width: 140px;">
          <template #body="slotProps">
            <span style="font-weight: 700; color: #475569;">
              Pensión #{{ slotProps.data.pension?.id ?? '-' }}
            </span>
          </template>
        </Column>

        <Column header="Fecha" style="color: #475569; width: 140px;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column
          field="descripcion"
          header="Descripción del Extra"
          style="color: #334155; font-weight: 500;"
        />

        <Column header="Precio Adicional" style="width: 160px; text-align: right;">
          <template #body="slotProps">
            <span style="font-weight: 800; color: #b45309;">
              {{ formatearMonto(slotProps.data.precio) }}
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
              aria-label="Editar extra"
              style="margin-right: .25rem;"
              @click="editarExtra(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar extra"
              @click="eliminarExtra(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Formulario -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Extra' : 'Nuevo Extra'"
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensión del Cliente</label>
          <Select
            v-model="idPension"
            :options="pensionesOpciones"
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione la pensión asociada"
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha</label>
          <input
            v-model="fecha"
            type="date"
            class="input-fecha-custom"
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Descripción</label>
          <InputText
            v-model="descripcion"
            maxlength="200"
            placeholder="Ej. Bebida gaseosa, porción extra de carne, postre"
            style="padding: 0.75rem 1rem;"
            fluid
          />
          <span style="font-size: 0.75rem; color: #94a3b8; text-align: right;">
            {{ descripcion.length }}/200 caracteres
          </span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Precio</label>
          <InputNumber
            v-model="precio"
            mode="currency"
            currency="BOB"
            locale="es-BO"
            :min="0"
            fluid
          />
        </div>

        <Button
          label="Guardar Consumo Extra"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarExtra"
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
            @click="eliminarExtraConfirmado"
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
