<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

import api from '../api/axios';

const menus = ref<any[]>([]);

const visible = ref(false);

const modoEdicion = ref(false);
const menuId = ref<number | null>(null);

const fecha = ref('');
const sopa = ref('');

const cargarMenus = async () => {
  try {
    const response = await api.get('/menus');
    menus.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const editarMenu = (menu: any) => {
  menuId.value = menu.id;

  fecha.value = menu.fecha;
  sopa.value = menu.sopa;

  modoEdicion.value = true;
  visible.value = true;
};

const eliminarMenu = async (id: number) => {
  const confirmar = confirm(
    '¿Eliminar menú?',
  );

  if (!confirmar) return;

  try {
    await api.delete(`/menus/${id}`);

    await cargarMenus();
  } catch (error) {
    console.error(error);
  }
};

const limpiarFormulario = () => {
  menuId.value = null;

  fecha.value = '';
  sopa.value = '';

  modoEdicion.value = false;
};

const guardarMenu = async () => {
  try {
    if (modoEdicion.value) {

      await api.patch(
  `/menus/${menuId.value}`,
  {
    fecha: new Date(fecha.value).toISOString(),
    sopa: sopa.value,
  },
);

    } else {

      await api.post(
  '/menus',
  {
    fecha: new Date(fecha.value).toISOString(),
    sopa: sopa.value,
  },
);

    }

    visible.value = false;

    limpiarFormulario();

    await cargarMenus();

  } catch (error) {
    console.error(error);
  }
};

const nuevoMenu = () => {
  limpiarFormulario();

  visible.value = true;
};

onMounted(() => {
  cargarMenus();
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
      <h1>Menús</h1>

      <Button
        label="Nuevo Menú"
        icon="pi pi-plus"
        @click="nuevoMenu"
      />
    </div>

    <DataTable
      :value="menus"
      stripedRows
      paginator
      :rows="10"
    >
      <Column
        field="id"
        header="ID"
      />

      <Column
        field="fecha"
        header="Fecha"
      />

      <Column
        field="sopa"
        header="Sopa"
      />

      <Column header="Acciones">
        <template #body="slotProps">

          <Button
            icon="pi pi-pencil"
            severity="warning"
            style="margin-right:.5rem"
            @click="editarMenu(slotProps.data)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="eliminarMenu(slotProps.data.id)"
          />

        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Menú'
          : 'Nuevo Menú'
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
        <div>
          <label>Fecha</label>

          <input
            v-model="fecha"
            type="date"
            style="
              width:100%;
              padding:.75rem;
            "
          />
        </div>

        <InputText
          v-model="sopa"
          placeholder="Nombre de la sopa"
        />

        <Button
          label="Guardar"
          icon="pi pi-save"
          @click="guardarMenu"
        />
      </div>
    </Dialog>

  </div>
</template>