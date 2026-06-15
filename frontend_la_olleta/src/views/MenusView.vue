<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';

import api from '../api/axios';

const menus = ref<any[]>([]);
const busquedaFecha = ref('');

const menusFiltrados = computed(() => {
  if (!busquedaFecha.value.trim()) return menus.value;
  return menus.value.filter((menu) => {
    const fechaFormateada = formatFecha(menu.fecha);
    return fechaFormateada.toLowerCase().includes(busquedaFecha.value.toLowerCase());
  });
});

const visible = ref(false);

const modoEdicion = ref(false);
const menuId = ref<number | null>(null);

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

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

  fecha.value = menu.fecha ? menu.fecha.slice(0, 10) : '';
  sopa.value = menu.sopa;

  modoEdicion.value = true;
  visible.value = true;
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este menú? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarMenuConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/menus/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarMenus();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
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
    const payload = {
      fecha: new Date(fecha.value + 'T00:00:00.000Z').toISOString(),
      sopa: sopa.value,
    };

    if (modoEdicion.value) {
      await api.patch(
        `/menus/${menuId.value}`,
        payload,
      );
    } else {
      await api.post(
        '/menus',
        payload,
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

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
};

onMounted(() => {
  cargarMenus();
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
          Menús
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Programación diaria del plato de sopa principal del menú.
        </p>
      </div>

      <Button
        label="Nuevo Menú"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoMenu"
      />
    </div>

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
          v-model="busquedaFecha"
          placeholder="Buscar por fecha..."
          style="padding: 0.75rem 1rem; flex: 1;"
          fluid
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
        :value="menusFiltrados"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column
          header="Fecha"
          style="font-weight: 600; color: #334155; width: 200px;"
        >
          <template #body="slotProps">
            {{ formatFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column
          field="sopa"
          header="Sopa"
          style="color: #475569;"
        />

        <Column header="Acciones" style="width: 140px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              style="margin-right: .25rem"
              @click="editarMenu(slotProps.data)"
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
          ? 'Editar Menú'
          : 'Nuevo Menú'
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha</label>
          <input
            v-model="fecha"
            type="date"
            style="
              width: 100%;
              padding: 0.75rem 1rem;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              font-family: inherit;
              box-sizing: border-box;
            "
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Sopa</label>
          <InputText
            v-model="sopa"
            placeholder="Ingrese el nombre de la sopa"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          fluid
          @click="guardarMenu"
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
            @click="eliminarMenuConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>