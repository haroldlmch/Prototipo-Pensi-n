<script setup lang="ts">
import { onMounted, ref } from 'vue';

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

onMounted(async () => {
  await cargarMenus();
  await cargarOpciones();
});
</script>

<template>
  <div>
    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:1rem;
      "
    >
      <h1>Opciones Menú</h1>

      <Button
        label="Nueva Opción"
        icon="pi pi-plus"
        @click="nuevoRegistro"
      />
    </div>

    <DataTable
      :value="opciones"
      stripedRows
      paginator
      :rows="10"
    >
      <Column
        field="id"
        header="ID"
      />

      <Column
        field="nombreSegundo"
        header="Segundo"
      />

      <Column
        header="Menú"
      >
        <template #body="slotProps">
          {{ slotProps.data.menu?.fecha }}
        </template>
      </Column>

      <Column
        header="Sopa"
      >
        <template #body="slotProps">
          {{ slotProps.data.menu?.sopa }}
        </template>
      </Column>

      <Column header="Acciones">
        <template #body="slotProps">

          <Button
            icon="pi pi-pencil"
            severity="warning"
            style="margin-right:.5rem"
            @click="editarRegistro(slotProps.data)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="eliminarRegistro(slotProps.data.id)"
          />

        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Opción'
          : 'Nueva Opción'
      "
      :style="{ width: '500px' }"
    >
      <div
        style="
          display:flex;
          flex-direction:column;
          gap:1rem;
        "
      >
        <InputText
          v-model="nombreSegundo"
          placeholder="Nombre del segundo"
        />

        <Select
          v-model="idMenu"
          :options="menus"
          optionLabel="fecha"
          optionValue="id"
          placeholder="Seleccione un menú"
        />

        <Button
          label="Guardar"
          icon="pi pi-save"
          @click="guardarRegistro"
        />
      </div>
    </Dialog>
  </div>
</template>