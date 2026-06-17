<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';

import api from '../api/axios';

const opciones = ref<any[]>([]);
const menus = ref<any[]>([]);

const visible = ref(false);

const modoEdicion = ref(false);
const opcionId = ref<number | null>(null);

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const nombreSegundo = ref('');
const menuFecha = ref<Date | null>(null);
const fechaBusqueda = ref<Date | null>(null);

const cargarOpciones = async () => {
  try {
    const response = await api.get('/opciones-menu');
    opciones.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const cargarMenus = async () => {
  try {
    const response = await api.get('/menus');
    menus.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const limpiarFormulario = () => {
  opcionId.value = null;
  nombreSegundo.value = '';
  menuFecha.value = null;
  modoEdicion.value = false;
};

const nuevoRegistro = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarRegistro = (opcion: any) => {
  opcionId.value = opcion.id;
  nombreSegundo.value = opcion.nombreSegundo;
  menuFecha.value = opcion.menu?.fecha ? new Date(opcion.menu.fecha) : null;
  modoEdicion.value = true;
  visible.value = true;
};

const guardarRegistro = async () => {
  try {
    // Buscar menú con la fecha seleccionada
    const menuEncontrado = menus.value.find((m) => {
      const fechaMenu = new Date(m.fecha).toISOString().slice(0, 10);
      const fechaSeleccionada = menuFecha.value ? new Date(menuFecha.value).toISOString().slice(0, 10) : '';
      return fechaMenu === fechaSeleccionada;
    });

    if (!menuEncontrado) {
      console.error('No se encontró menú para la fecha seleccionada');
      return;
    }

    const payload = {
      nombreSegundo: nombreSegundo.value,
      idMenu: menuEncontrado.id,
    };

    if (modoEdicion.value) {
      await api.patch(
        `/opciones-menu/${opcionId.value}`,
        payload,
      );
    } else {
      await api.post(
        '/opciones-menu',
        payload,
      );
    }

    visible.value = false;
    limpiarFormulario();
    await cargarOpciones();
  } catch (error) {
    console.error(error);
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar esta opción de menú? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarRegistroConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/opciones-menu/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarOpciones();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
  }
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
};

const menusOpciones = computed(() => {
  return menus.value.map((m) => ({
    ...m,
    descripcion: `${formatFecha(m.fecha)} - Sopa: ${m.sopa}`,
  }));
});

const opcionesFiltradas = computed(() => {
  if (!fechaBusqueda.value) {
    return opciones.value;
  }

  const fechaSeleccionada = new Date(fechaBusqueda.value).toISOString().slice(0, 10);
  return opciones.value.filter((opcion) => {
    const fechaOpcion = new Date(opcion.menu?.fecha).toISOString().slice(0, 10);
    return fechaOpcion === fechaSeleccionada;
  });
});

onMounted(async () => {
  await cargarMenus();
  await cargarOpciones();
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      "
    >
      <div>
        <h1
          style="
            margin: 0;
            font-size: 2rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
          "
        >
          Opciones Menú
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Configuración del plato principal (segundo) asociado a un menú diario.
        </p>
      </div>

      <Button
        label="Nueva Opción"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoRegistro"
      />
    </div>

    <!-- Buscador por Fecha -->
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
        <i class="pi pi-calendar" style="color: #94a3b8;"></i>
        <div style="flex: 1;">
          <label style="display: block; font-weight: 600; color: #475569; font-size: 0.85rem; margin-bottom: 0.5rem;">
            Buscar por Fecha del Menú
          </label>
          <Calendar
            v-model="fechaBusqueda"
            dateFormat="dd/mm/yy"
            placeholder="Seleccione una fecha"
            :showIcon="true"
            fluid
          />
        </div>
        <Button
          v-if="fechaBusqueda"
          icon="pi pi-times"
          severity="secondary"
          text
          rounded
          @click="fechaBusqueda = null"
          style="align-self: flex-end;"
        />
      </div>
    </div>

    <!-- Contenedor Tabla -->
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
        :value="opcionesFiltradas"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column
          field="nombreSegundo"
          header="Segundo (Plato Principal)"
          style="font-weight: 600; color: #334155;"
        />

        <Column
          header="Fecha Menú"
          style="color: #475569; width: 180px;"
        >
          <template #body="slotProps">
            {{ formatFecha(slotProps.data.menu?.fecha) }}
          </template>
        </Column>

        <Column
          header="Sopa Acompañante"
          style="color: #475569;"
        >
          <template #body="slotProps">
            {{ slotProps.data.menu?.sopa || 'No especificada' }}
          </template>
        </Column>

        <Column header="Acciones" style="width: 140px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              style="margin-right: .25rem"
              @click="editarRegistro(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
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
      :header="
        modoEdicion
          ? 'Editar Opción'
          : 'Nueva Opción'
      "
      :style="{ width: '450px' }"
    >
      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-top: 0.5rem;
        "
      >
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Plato Principal (Segundo)</label>
          <InputText
            v-model="nombreSegundo"
            placeholder="Ingrese el nombre del segundo"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Menú Diario (Seleccionar Fecha)</label>
          <Calendar
            v-model="menuFecha"
            dateFormat="dd/mm/yy"
            placeholder="Seleccione la fecha del menú"
            :showIcon="true"
            fluid
          />
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          fluid
          @click="guardarRegistro"
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
            @click="eliminarRegistroConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>