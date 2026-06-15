<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

import api from '../api/axios';

interface Pensionado {
  nombreCompleto: string;
}

interface Pension {
  id: number;
  completosDisponibles: number;
  estado: string;
  pensionado?: Pensionado;
}

interface Menu {
  fecha: string;
  sopa: string;
}

interface OpcionMenu {
  id: number;
  nombreSegundo: string;
  menu?: Menu;
}

interface Consumo {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  tipoConsumo: string;
  pension?: Pension;
  opcionMenu?: OpcionMenu;
}

const consumos = ref<Consumo[]>([]);
const pensiones = ref<Pension[]>([]);
const opcionesMenu = ref<OpcionMenu[]>([]);

const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const consumoId = ref<number | null>(null);
const fecha = ref('');
const cantidadCompletos = ref<number | null>(1);
const tipoConsumo = ref('ALMUERZO');
const idPension = ref<number | null>(null);
const idOpcionMenu = ref<number | null>(null);

const tiposConsumo = ['ALMUERZO', 'PARA LLEVAR', 'OTRO'];

const pensionesOpciones = computed(() =>
  pensiones.value.map((pension) => ({
    ...pension,
    descripcion: `${pension.pensionado?.nombreCompleto ?? 'Sin pensionado'} - ${pension.completosDisponibles} disponibles`,
  })),
);

const opcionesMenuOpciones = computed(() =>
  opcionesMenu.value.map((opcion) => ({
    ...opcion,
    descripcion: `${opcion.menu?.fecha ?? 'Sin fecha'} - ${opcion.nombreSegundo}`,
  })),
);

const pensionSeleccionada = computed(() =>
  pensiones.value.find((pension) => pension.id === idPension.value),
);

const formularioValido = computed(
  () =>
    Boolean(fecha.value) &&
    Boolean(tipoConsumo.value.trim()) &&
    cantidadCompletos.value !== null &&
    cantidadCompletos.value >= 1 &&
    idPension.value !== null &&
    idOpcionMenu.value !== null,
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
    const [consumosResponse, pensionesResponse, opcionesResponse] =
      await Promise.all([
        api.get('/consumos'),
        api.get('/pensiones'),
        api.get('/opciones-menu'),
      ]);

    consumos.value = consumosResponse.data;
    pensiones.value = pensionesResponse.data;
    opcionesMenu.value = opcionesResponse.data;
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  consumoId.value = null;
  fecha.value = obtenerFechaLocal();
  cantidadCompletos.value = 1;
  tipoConsumo.value = 'ALMUERZO';
  idPension.value = null;
  idOpcionMenu.value = null;
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevoConsumo = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarConsumo = (consumo: Consumo) => {
  consumoId.value = consumo.id;
  fecha.value = consumo.fecha.slice(0, 10);
  cantidadCompletos.value = consumo.cantidadCompletos;
  tipoConsumo.value = consumo.tipoConsumo;
  idPension.value = consumo.pension?.id ?? null;
  idOpcionMenu.value = consumo.opcionMenu?.id ?? null;
  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const guardarConsumo = async () => {
  if (!formularioValido.value) {
    errorMensaje.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  const payload = {
    fecha: convertirFechaISO(fecha.value),
    cantidadCompletos: Number(cantidadCompletos.value),
    tipoConsumo: tipoConsumo.value,
    idPension: Number(idPension.value),
    idOpcionMenu: Number(idOpcionMenu.value),
  };

  try {
    if (modoEdicion.value) {
      await api.patch(`/consumos/${consumoId.value}`, payload);
    } else {
      await api.post('/consumos', payload);
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

const eliminarConsumo = async (id: number) => {
  if (!confirm('¿Eliminar consumo? Los completos serán devueltos a la pensión.')) {
    return;
  }

  errorMensaje.value = '';

  try {
    await api.delete(`/consumos/${id}`);
    await cargarDatos();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  }
};

const formatearFecha = (valor: string) => {
  if (!valor) return '-';
  return new Intl.DateTimeFormat('es-BO', { timeZone: 'UTC' }).format(
    new Date(valor),
  );
};

const obtenerNombrePensionado = (consumo: Consumo) =>
  consumo.pension?.pensionado?.nombreCompleto ??
  pensiones.value.find((pension) => pension.id === consumo.pension?.id)
    ?.pensionado?.nombreCompleto ??
  'No disponible';

const obtenerDetalleMenu = (consumo: Consumo) => {
  const opcionCatalogo = opcionesMenu.value.find(
    (item) => item.id === consumo.opcionMenu?.id,
  );
  const opcion = opcionCatalogo ?? consumo.opcionMenu;

  return opcion
    ? `${opcion.menu?.sopa ?? 'Sin sopa'} / ${opcion.nombreSegundo}`
    : 'No disponible';
};

const getTipoConsumoSeverity = (tipo: string) => {
  switch (tipo?.toUpperCase()) {
    case 'ALMUERZO':
      return 'success';
    case 'DESAYUNO':
      return 'info';
    case 'CENA':
      return 'secondary';
    case 'PARA LLEVAR':
      return 'warn';
    default:
      return 'contrast';
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Consumos
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Registro de platos de comida consumidos y cargados a los planes de pensionados.
        </p>
      </div>

      <Button
        label="Nuevo Consumo"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoConsumo"
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
        :value="consumos"
        :loading="cargando"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay consumos registrados"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column
          field="id"
          header="ID"
          style="width: 80px;"
        />

        <Column header="Pensionado" style="font-weight: 600; color: #334155;">
          <template #body="slotProps">
            {{ obtenerNombrePensionado(slotProps.data) }}
          </template>
        </Column>

        <Column header="Fecha" style="color: #475569; width: 140px;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column
          field="cantidadCompletos"
          header="Completos"
          style="width: 110px; text-align: center; font-weight: 700;"
        />

        <Column
          field="tipoConsumo"
          header="Tipo de Consumo"
          style="width: 160px;"
        >
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.tipoConsumo"
              :severity="getTipoConsumoSeverity(slotProps.data.tipoConsumo)"
            />
          </template>
        </Column>

        <Column header="Detalle Menú (Sopa / Segundo)" style="color: #475569;">
          <template #body="slotProps">
            {{ obtenerDetalleMenu(slotProps.data) }}
          </template>
        </Column>

        <Column header="Acciones" style="width: 140px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              aria-label="Editar consumo"
              style="margin-right: .25rem;"
              @click="editarConsumo(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar consumo"
              @click="eliminarConsumo(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Formulario -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Consumo' : 'Nuevo Consumo'"
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
            placeholder="Seleccione una pensión"
            fluid
          />
          <small v-if="pensionSeleccionada" style="color: #10b981; font-weight: 600; margin-top: 0.1rem;">
            * Cuenta con {{ pensionSeleccionada.completosDisponibles }} platos disponibles.
          </small>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha</label>
          <input
            v-model="fecha"
            type="date"
            class="input-fecha-custom"
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Cantidad</label>
            <InputNumber
              v-model="cantidadCompletos"
              :min="1"
              :max="100"
              showButtons
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Tipo Consumo</label>
            <Select
              v-model="tipoConsumo"
              :options="tiposConsumo"
              fluid
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Opción de Menú (Sopa / Segundo)</label>
          <Select
            v-model="idOpcionMenu"
            :options="opcionesMenuOpciones"
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione una opción"
            fluid
          />
        </div>

        <Button
          label="Guardar Consumo"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarConsumo"
        />
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
