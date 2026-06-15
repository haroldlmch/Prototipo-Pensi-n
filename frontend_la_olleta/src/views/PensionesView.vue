<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';

import api from '../api/axios';

const pensiones = ref<any[]>([]);
const pensionados = ref<any[]>([]);

const visible = ref(false);

const modoEdicion = ref(false);
const pensionId = ref<number | null>(null);

const fechaInicio = ref('');
const cantidadCompletos = ref('');
const completosDisponibles = ref('');
const estado = ref('ACTIVA');
const idPensionado = ref<number | null>(null);

const cargarPensiones = async () => {
  try {
    const response = await api.get('/pensiones');
    pensiones.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const cargarPensionados = async () => {
  try {
    const response = await api.get('/pensionados');
    pensionados.value = response.data;
  } catch (error) {
    console.error(error);
  }
};

const limpiarFormulario = () => {
  pensionId.value = null;

  fechaInicio.value = '';
  cantidadCompletos.value = '';
  completosDisponibles.value = '';
  estado.value = 'ACTIVA';
  idPensionado.value = null;

  modoEdicion.value = false;
};

const nuevaPension = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarPension = (pension: any) => {
  pensionId.value = pension.id;

  fechaInicio.value = pension.fechaInicio;

  cantidadCompletos.value =
    String(pension.cantidadCompletos);

  completosDisponibles.value =
    String(pension.completosDisponibles);

  estado.value =
    pension.estado;

  idPensionado.value =
    pension.pensionado?.id;

  modoEdicion.value = true;
  visible.value = true;
};

const guardarPension = async () => {
  try {
    const payload = {
      fechaInicio: new Date(
        fechaInicio.value,
      ).toISOString(),

      cantidadCompletos: Number(
        cantidadCompletos.value,
      ),

      completosDisponibles: Number(
        completosDisponibles.value,
      ),

      estado: estado.value,

      idPensionado: Number(
        idPensionado.value,
      ),
    };

    if (modoEdicion.value) {
      await api.patch(
        `/pensiones/${pensionId.value}`,
        payload,
      );
    } else {
      await api.post(
        '/pensiones',
        payload,
      );
    }

    visible.value = false;

    limpiarFormulario();

    await cargarPensiones();

  } catch (error) {
    console.error(error);
  }
};

const eliminarPension = async (
  id: number,
) => {

  const confirmar = confirm(
    '¿Eliminar pensión?',
  );

  if (!confirmar) return;

  try {
    await api.delete(
      `/pensiones/${id}`,
    );

    await cargarPensiones();

  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  await cargarPensionados();
  await cargarPensiones();
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
      <h1>Pensiones</h1>

      <Button
        label="Nueva Pensión"
        icon="pi pi-plus"
        @click="nuevaPension"
      />
    </div>

    <DataTable
      :value="pensiones"
      stripedRows
      paginator
      :rows="10"
    >

      <Column
        field="id"
        header="ID"
      />

      <Column
        header="Pensionado"
      >
        <template #body="slotProps">
          {{ slotProps.data.pensionado?.nombreCompleto }}
        </template>
      </Column>

      <Column
        field="fechaInicio"
        header="Fecha Inicio"
      />

      <Column
        field="cantidadCompletos"
        header="Completos"
      />

      <Column
        field="completosDisponibles"
        header="Disponibles"
      />

      <Column
        field="estado"
        header="Estado"
      />

      <Column header="Acciones">
        <template #body="slotProps">

          <Button
            icon="pi pi-pencil"
            severity="warning"
            style="margin-right:.5rem"
            @click="editarPension(slotProps.data)"
          />

          <Button
            icon="pi pi-trash"
            severity="danger"
            @click="eliminarPension(slotProps.data.id)"
          />

        </template>
      </Column>

    </DataTable>

    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Pensión'
          : 'Nueva Pensión'
      "
      :style="{ width: '600px' }"
    >

      <div
        style="
          display:flex;
          flex-direction:column;
          gap:1rem;
        "
      >

        <Select
          v-model="idPensionado"
          :options="pensionados"
          optionLabel="nombreCompleto"
          optionValue="id"
          placeholder="Seleccione un pensionado"
        />

        <div>
          <label>
            Fecha Inicio
          </label>

          <input
            v-model="fechaInicio"
            type="date"
            style="
              width:100%;
              padding:.75rem;
            "
          />
        </div>

        <InputText
          v-model="cantidadCompletos"
          placeholder="Cantidad de completos"
        />

        <InputText
          v-model="completosDisponibles"
          placeholder="Completos disponibles"
        />

        <InputText
          v-model="estado"
          placeholder="Estado"
        />

        <Button
          label="Guardar"
          icon="pi pi-save"
          @click="guardarPension"
        />

      </div>

    </Dialog>

  </div>
</template>