<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
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

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const consumoId = ref<number | null>(null);
const fecha = ref('');
const cantidadCompletos = ref<number | null>(1);
const tipoConsumo = ref('Almuerzo');
const idPension = ref<number | null>(null);
const idOpcionMenu = ref<number | null>(null);

const tiposConsumo = ['Almuerzo', 'Para llevar'];

// Variables para búsqueda y filtro
const busquedaNombre = ref('');
const busquedaFecha = ref<Date | null>(null);
const tipoFiltro = ref('todos'); // 'nombre', 'fecha', 'todos'

const consumosFiltrados = computed(() => {
  let resultado = consumos.value;

  if (tipoFiltro.value === 'nombre' || tipoFiltro.value === 'todos') {
    if (busquedaNombre.value.trim()) {
      resultado = resultado.filter((consumo) =>
        (consumo.pension?.pensionado?.nombreCompleto ?? '')
          .toLowerCase()
          .includes(busquedaNombre.value.toLowerCase()),
      );
    }
  }

  if (tipoFiltro.value === 'fecha' || tipoFiltro.value === 'todos') {
    if (busquedaFecha.value) {
      const fechaSeleccionada = new Date(busquedaFecha.value);
      fechaSeleccionada.setHours(0, 0, 0, 0);

      resultado = resultado.filter((consumo) => {
        const fechaConsumo = new Date(consumo.fecha);
        fechaConsumo.setHours(0, 0, 0, 0);
        return fechaConsumo.getTime() === fechaSeleccionada.getTime();
      });
    }
  }

  return resultado;
});

const pensionesOpciones = computed(() =>
  pensiones.value.map((pension) => ({
    ...pension,
    descripcion: `${pension.pensionado?.nombreCompleto ?? 'Sin pensionado'}`,
  })),
);

const opcionesMenuOpciones = computed(() => {
  let opciones = opcionesMenu.value;
  if (fecha.value) {
    opciones = opciones.filter(
      (opcion) => opcion.menu?.fecha === fecha.value,
    );
  }
  return opciones.map((opcion) => ({
    ...opcion,
    descripcion: `${opcion.nombreSegundo}`,
  }));
});

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

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este consumo? Los completos serán devueltos a la pensión correspondientes.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarConsumoConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';
  try {
    await api.delete(`/consumos/${idAEliminar.value}`);
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

    <!-- Buscador Avanzado -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem; min-width: 100px;">
            Filtrar por:
          </label>
          <Select
            v-model="tipoFiltro"
            :options="[
              { label: 'Nombre', value: 'nombre' },
              { label: 'Fecha', value: 'fecha' },
              { label: 'Nombre y Fecha', value: 'todos' },
            ]"
            optionLabel="label"
            optionValue="value"
            style="flex: 1;"
            fluid
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div
            v-if="tipoFiltro === 'nombre' || tipoFiltro === 'todos'"
            style="display: flex; align-items: center; gap: 0.75rem;"
          >
            <i class="pi pi-search" style="color: #94a3b8;"></i>
            <InputText
              v-model="busquedaNombre"
              placeholder="Buscar por nombre..."
              style="padding: 0.75rem 1rem; flex: 1;"
              fluid
            />
          </div>

          <div
            v-if="tipoFiltro === 'fecha' || tipoFiltro === 'todos'"
            style="display: flex; align-items: center; gap: 0.75rem;"
          >
            <i class="pi pi-calendar" style="color: #94a3b8;"></i>
            <Calendar
              v-model="busquedaFecha"
              dateFormat="dd/mm/yy"
              placeholder="Seleccionar fecha..."
              style="flex: 1;"
              showIcon
            />
          </div>
        </div>
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
        :value="consumosFiltrados"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay consumos registrados"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

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
            @click="eliminarConsumoConfirmado"
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
