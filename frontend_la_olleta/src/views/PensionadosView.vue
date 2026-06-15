<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';

import api from '../api/axios';

const pensionados = ref<any[]>([]);

const visible = ref(false);

const modoEdicion = ref(false);
const pensionadoId = ref<number | null>(null);

const nombreCompleto = ref('');
const telefono = ref('');
const estado = ref(true);

const cargarPensionados = async () => {
  try {
    const response = await api.get('/pensionados');
    pensionados.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const editarPensionado = (pensionado: any) => {
  pensionadoId.value = pensionado.id;

  nombreCompleto.value = pensionado.nombreCompleto;
  telefono.value = pensionado.telefono ?? '';
  estado.value = pensionado.estado;

  modoEdicion.value = true;
  visible.value = true;
};

const eliminarPensionado = async (id: number) => {
  const confirmar = confirm(
    '¿Eliminar pensionado?',
  );

  if (!confirmar) return;

  try {
    await api.delete(`/pensionados/${id}`);

    await cargarPensionados();
  } catch (error) {
    console.error(error);
  }
};

const limpiarFormulario = () => {
  pensionadoId.value = null;
  nombreCompleto.value = '';
  telefono.value = '';
  estado.value = true;
  modoEdicion.value = false;
};

const guardarPensionado = async () => {
  try {
    if (modoEdicion.value) {
      await api.patch(
        `/pensionados/${pensionadoId.value}`,
        {
          nombreCompleto: nombreCompleto.value,
          telefono: telefono.value,
          estado: estado.value,
        },
      );
    } else {
      await api.post('/pensionados', {
        nombreCompleto: nombreCompleto.value,
        telefono: telefono.value,
        estado: estado.value,
      });
    }

    visible.value = false;

    limpiarFormulario();

    await cargarPensionados();
  } catch (error) {
    console.error(error);
  }
};

const nuevoPensionado = () => {
  limpiarFormulario();
  visible.value = true;
};

onMounted(() => {
  cargarPensionados();
});
</script>

<template>
  <div>
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      "
    >
      <h1>Pensionados</h1>

      <Button
        label="Nuevo Pensionado"
        icon="pi pi-plus"
        @click="nuevoPensionado"
      />
    </div>

    <DataTable
      :value="pensionados"
      stripedRows
      paginator
      :rows="10"
    >
      <Column
        field="id"
        header="ID"
      />

      <Column
        field="nombreCompleto"
        header="Nombre Completo"
      />

      <Column
        field="telefono"
        header="Teléfono"
      />

      <Column
        field="estado"
        header="Estado"
      >
        <template #body="slotProps">
          {{ slotProps.data.estado ? 'Activo' : 'Inactivo' }}
        </template>
      </Column>

      <Column header="Acciones">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            severity="warning"
            style="margin-right: .5rem"
            @click="editarPensionado(slotProps.data)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="eliminarPensionado(slotProps.data.id)"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Pensionado'
          : 'Nuevo Pensionado'
      "
      :style="{ width: '500px' }"
    >
      <div
        style="
          display: flex;
          flex-direction: column;
          gap: 1rem;
        "
      >
        <InputText
          v-model="nombreCompleto"
          placeholder="Nombre completo"
        />

        <InputText
          v-model="telefono"
          placeholder="Teléfono"
        />

        <div>
          <Checkbox
            v-model="estado"
            binary
          />

          <span style="margin-left: .5rem">
            Activo
          </span>
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          @click="guardarPensionado"
        />
      </div>
    </Dialog>
  </div>
</template>