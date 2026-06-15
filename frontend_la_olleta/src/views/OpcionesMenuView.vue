<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

import api from '../api/axios';

const opciones = ref<any[]>([]);
const menus = ref<any[]>([]);

const visible = ref(false);

const modoEdicion = ref(false);
const opcionId = ref<number | null>(null);

const nombreSegundo = ref('');
const idMenu = ref<number | null>(null);

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
  idMenu.value = null;
  modoEdicion.value = false;
};

const nuevoRegistro = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarRegistro = (opcion: any) => {
  opcionId.value = opcion.id;

  nombreSegundo.value = opcion.nombreSegundo;
  idMenu.value = opcion.menu?.id;

  modoEdicion.value = true;
  visible.value = true;
};

const guardarRegistro = async () => {
  try {
    const payload = {
      nombreSegundo: nombreSegundo.value,
      idMenu: Number(idMenu.value),
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

const eliminarRegistro = async (id: number) => {
  const confirmar = confirm(
    '¿Eliminar opción de menú?',
  );

  if (!confirmar) return;

  try {
    await api.delete(
      `/opciones-menu/${id}`,
    );

    await cargarOpciones();
  } catch (error) {
    console.error(error);
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
        :value="opciones"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <Column
          field="id"
          header="ID"
          style="width: 80px;"
        />

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
              @click="eliminarRegistro(slotProps.data.id)"
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Menú Diario</label>
          <Select
            v-model="idMenu"
            :options="menusOpciones"
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione el menú asociado"
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
  </div>
</template>