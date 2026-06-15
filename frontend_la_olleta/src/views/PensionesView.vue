<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

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

  // Extract date part only (yyyy-MM-dd)
  fechaInicio.value = pension.fechaInicio ? pension.fechaInicio.slice(0, 10) : '';

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
        fechaInicio.value + 'T00:00:00.000Z'
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

const getEstadoSeverity = (estadoStr: string) => {
  switch (estadoStr?.toUpperCase()) {
    case 'ACTIVA':
      return 'success';
    case 'AGOTADA':
      return 'danger';
    case 'INACTIVA':
    default:
      return 'secondary';
  }
};

const getProgresoColor = (disp: number, cant: number) => {
  const ratio = cant > 0 ? disp / cant : 0;
  if (ratio <= 0.2) return '#dc2626'; // Rojo
  if (ratio <= 0.5) return '#f59e0b'; // Amarillo/Naranja
  return '#10b981'; // Verde
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const date = new Date(fechaStr);
  return date.toLocaleDateString('es-ES', { timeZone: 'UTC' });
};

onMounted(async () => {
  await cargarPensionados();
  await cargarPensiones();
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
          Pensiones
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Planes y suscripciones de alimentación activos de los clientes.
        </p>
      </div>

      <Button
        label="Nueva Pensión"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevaPension"
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
        :value="pensiones"
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
          header="Pensionado"
          style="font-weight: 600; color: #334155;"
        >
          <template #body="slotProps">
            {{ slotProps.data.pensionado?.nombreCompleto }}
          </template>
        </Column>

        <Column
          header="Fecha Inicio"
          style="color: #475569; width: 140px;"
        >
          <template #body="slotProps">
            {{ formatFecha(slotProps.data.fechaInicio) }}
          </template>
        </Column>

        <Column
          header="Completos Disponibles"
          style="width: 200px;"
        >
          <template #body="slotProps">
            <div style="display: flex; flex-direction: column; gap: 0.3rem;">
              <span style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">
                {{ slotProps.data.completosDisponibles }} de {{ slotProps.data.cantidadCompletos }}
              </span>
              <div style="height: 6px; background: #f1f5f9; border-radius: 3px; border: 1px solid #e2e8f0; overflow: hidden; width: 100%;">
                <div
                  :style="`width: ${(slotProps.data.completosDisponibles / slotProps.data.cantidadCompletos) * 100}%; height: 100%; background-color: ${getProgresoColor(slotProps.data.completosDisponibles, slotProps.data.cantidadCompletos)};`"
                ></div>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="estado"
          header="Estado"
          style="width: 130px;"
        >
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.estado"
              :severity="getEstadoSeverity(slotProps.data.estado)"
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
              @click="editarPension(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="eliminarPension(slotProps.data.id)"
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
          ? 'Editar Pensión'
          : 'Nueva Pensión'
      "
      :style="{ width: '500px' }"
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
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensionado</label>
          <Select
            v-model="idPensionado"
            :options="pensionados"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Seleccione un pensionado"
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha Inicio</label>
          <input
            v-model="fechaInicio"
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

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Cantidad Completos</label>
            <InputText
              v-model="cantidadCompletos"
              placeholder="Ej. 20"
              style="padding: 0.75rem 1rem;"
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Disponibles</label>
            <InputText
              v-model="completosDisponibles"
              placeholder="Ej. 20"
              style="padding: 0.75rem 1rem;"
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Estado</label>
          <Select
            v-model="estado"
            :options="['ACTIVA', 'INACTIVA', 'AGOTADA']"
            placeholder="Estado de la pensión"
            fluid
          />
        </div>

        <Button
          label="Guardar"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          fluid
          @click="guardarPension"
        />
      </div>
    </Dialog>
  </div>
</template>