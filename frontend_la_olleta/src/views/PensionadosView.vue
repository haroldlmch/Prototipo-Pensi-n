<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';

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
          Pensionados
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Directorio de beneficiarios registrados en el sistema de pensiones.
        </p>
      </div>

      <Button
        label="Nuevo Pensionado"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoPensionado"
      />
    </div>

    <!-- Contenedor de Tabla Principal -->
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
        :value="pensionados"
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
          field="nombreCompleto"
          header="Nombre Completo"
          style="font-weight: 600; color: #334155;"
        />

        <Column
          field="telefono"
          header="Teléfono"
          style="color: #475569;"
        >
          <template #body="slotProps">
            {{ slotProps.data.telefono || 'Sin teléfono' }}
          </template>
        </Column>

        <Column
          field="estado"
          header="Estado"
          style="width: 120px;"
        >
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.estado ? 'Activo' : 'Inactivo'"
              :severity="slotProps.data.estado ? 'success' : 'danger'"
            />
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
              @click="editarPensionado(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="eliminarPensionado(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Creación / Edición -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="
        modoEdicion
          ? 'Editar Pensionado'
          : 'Nuevo Pensionado'
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Nombre Completo</label>
          <InputText
            v-model="nombreCompleto"
            placeholder="Ingrese el nombre completo"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Teléfono</label>
          <InputText
            v-model="telefono"
            placeholder="Ingrese el número de teléfono"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
          <Checkbox
            v-model="estado"
            binary
            id="estado-pensionado"
          />
          <label for="estado-pensionado" style="font-weight: 600; color: #475569; font-size: 0.9rem; cursor: pointer;">
            Pensionado Activo
          </label>
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          fluid
          @click="guardarPensionado"
        />
      </div>
    </Dialog>
  </div>
</template>