<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';

import api from '../api/axios';

const pensiones = ref<any[]>([]);
const pensionados = ref<any[]>([]);
const busquedaPensionado = ref('');

const pensioneFiltradas = computed(() => {
  if (!busquedaPensionado.value.trim()) return pensiones.value;
  return pensiones.value.filter((pension) =>
    pension.pensionado?.nombreCompleto?.toLowerCase().includes(busquedaPensionado.value.toLowerCase()) || false,
  );
});

const pensionadosFiltrados = computed(() => {
  if (!pensionados.value.length) return [];
  const idsConPension = pensiones.value
    .filter((p) => !modoEdicion.value || p.id !== pensionId.value)
    .map((p) => p.pensionado?.id || p.idPensionado);
  return pensionados.value.filter((p) => !idsConPension.includes(p.id));
});

const visible = ref(false);

const modoEdicion = ref(false);
const pensionId = ref<number | null>(null);

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const fechaInicio = ref('');
const cantidadCompletos = ref('');
const completosDisponibles = ref('');
const estado = ref('ACTIVA');
const idPensionado = ref<number | null>(null);

const cargarPensiones = async () => {
  try {
    const response = await api.get('/pensiones');
    pensiones.value = response.data;
    
    // Actualizar automáticamente a AGOTADA si completosDisponibles es 0
    for (const pension of pensiones.value) {
      if (pension.completosDisponibles === 0 && pension.estado !== 'AGOTADA') {
        try {
          const payload = {
            fechaInicio: pension.fechaInicio,
            cantidadCompletos: pension.cantidadCompletos,
            completosDisponibles: pension.completosDisponibles,
            estado: 'AGOTADA',
            idPensionado: pension.pensionado?.id || pension.idPensionado,
          };
          await api.patch(`/pensiones/${pension.id}`, payload);
          pension.estado = 'AGOTADA';
        } catch (error) {
          console.error(`Error al actualizar pensión ${pension.id}:`, error);
        }
      }
    }
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

    let response;
    if (modoEdicion.value) {
      response = await api.patch(
        `/pensiones/${pensionId.value}`,
        payload,
      );
    } else {
      response = await api.post(
        '/pensiones',
        payload,
      );
    }

    const pensionGuardada = response.data;
    visible.value = false;

    if (!modoEdicion.value) {
      const pensionadoObj = pensionados.value.find((p) => p.id === payload.idPensionado);
      pensionSeleccionadaParaPago.value = {
        ...pensionGuardada,
        pensionado: pensionadoObj,
      };
      idPensionPago.value = pensionGuardada.id;
      fechaPago.value = obtenerFechaLocal();
      precioUnitario.value = precioPensionadoSugerido.value;
      montoTotal.value = null;
      errorMensajePago.value = '';
      visiblePago.value = true;
    }

    limpiarFormulario();
    await cargarPensiones();

  } catch (error) {
    console.error(error);
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar esta pensión? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarPensionConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/pensiones/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarPensiones();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
  }
};

const getEstadoSeverity = (estadoStr: string) => {
  switch (estadoStr?.toUpperCase()) {
    case 'ACTIVA':
      return 'success';
    case 'AGOTADA':
      return 'danger';
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

watch(cantidadCompletos, (newVal) => {
  if (!modoEdicion.value) {
    completosDisponibles.value = newVal;
  }
});

// Estado para el diálogo de registro de pago
const visiblePago = ref(false);
const guardandoPago = ref(false);
const errorMensajePago = ref('');

const fechaPago = ref('');
const precioUnitario = ref<number | null>(null);
const montoTotal = ref<number | null>(null);
const idPensionPago = ref<number | null>(null);
const pensionSeleccionadaParaPago = ref<any>(null);

const obtenerFechaLocal = () => {
  const fecha = new Date();
  const desplazamiento = fecha.getTimezoneOffset() * 60_000;
  return new Date(fecha.getTime() - desplazamiento).toISOString().slice(0, 10);
};

const formularioPagoValido = computed(
  () =>
    Boolean(fechaPago.value) &&
    idPensionPago.value !== null &&
    precioUnitario.value !== null &&
    precioUnitario.value >= 0 &&
    montoTotal.value !== null &&
    montoTotal.value >= 0,
);

const guardarPago = async () => {
  if (!formularioPagoValido.value) {
    errorMensajePago.value = 'Complete todos los campos requeridos.';
    return;
  }

  guardandoPago.value = true;
  errorMensajePago.value = '';

  const payload = {
    fechaPago: new Date(fechaPago.value + 'T00:00:00.000Z').toISOString(),
    precioUnitario: Number(precioUnitario.value),
    montoTotal: Number(montoTotal.value),
    idPension: Number(idPensionPago.value),
  };

  try {
    await api.post('/pagos', payload);
    visiblePago.value = false;
    await cargarPensiones();
  } catch (error) {
    console.error(error);
    const posibleError = error as {
      response?: { data?: { message?: string | string[] } };
    };
    const mensaje = posibleError.response?.data?.message;
    errorMensajePago.value = Array.isArray(mensaje)
      ? mensaje.join('. ')
      : (mensaje ?? 'No se pudo registrar el pago.');
  } finally {
    guardandoPago.value = false;
  }
};

const precioPensionadoSugerido = ref<number | null>(null);

const cargarConfiguracion = async () => {
  try {
    const response = await api.get('/configuracion');
    const config = Array.isArray(response.data) ? response.data[0] : response.data;
    if (config) {
      precioPensionadoSugerido.value = Number(config.precioPensionado);
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
};

watch(precioUnitario, (newPrecio) => {
  if (newPrecio === null || !pensionSeleccionadaParaPago.value) {
    montoTotal.value = null;
    return;
  }
  montoTotal.value = newPrecio * Number(pensionSeleccionadaParaPago.value.cantidadCompletos);
});

onMounted(async () => {
  await cargarPensionados();
  await cargarPensiones();
  await cargarConfiguracion();
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
          v-model="busquedaPensionado"
          placeholder="Buscar por nombre de pensionado..."
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
        :value="pensioneFiltradas"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

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
              @click="confirmarEliminar(slotProps.data.id)"
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
            :options="pensionadosFiltrados"
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
              disabled
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Estado</label>
          <Select
            v-model="estado"
            :options="['ACTIVA', 'AGOTADA']"
            placeholder="Estado de la pensión"
            fluid
          />
        </div>

        <Button
          :label="modoEdicion ? 'Guardar' : 'Guardar y pasar al pago'"
          :icon="modoEdicion ? 'pi pi-save' : 'pi pi-credit-card'"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          fluid
          @click="guardarPension"
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
            @click="eliminarPensionConfirmado"
          />
        </div>
      </div>
    </Dialog>

    <!-- Dialogo de Registro de Pago (después de nueva pensión) -->
    <Dialog
      v-model:visible="visiblePago"
      modal
      header="Registrar Pago de Pensión"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message
          v-if="errorMensajePago"
          severity="error"
          :closable="false"
          style="margin-bottom: 0.5rem;"
        >
          {{ errorMensajePago }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensión</label>
          <InputText
            :value="pensionSeleccionadaParaPago ? `${pensionSeleccionadaParaPago.pensionado?.nombreCompleto || 'Pensionado'} - Pensión #${pensionSeleccionadaParaPago.id}` : ''"
            disabled
            style="padding: 0.75rem 1rem;"
          />
          <small v-if="pensionSeleccionadaParaPago" style="color: #3b82f6; font-weight: 600; margin-top: 0.1rem;">
            * Incluye un total de {{ pensionSeleccionadaParaPago.cantidadCompletos }} completos.
          </small>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha de Pago</label>
          <input
            v-model="fechaPago"
            type="date"
            style="
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
            "
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Precio por Completo</label>
            <InputNumber
              v-model="precioUnitario"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Monto Total</label>
            <InputNumber
              v-model="montoTotal"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>
        </div>

        <Button
          label="Guardar Registro de Pago"
          icon="pi pi-save"
          style="margin-top: 0.5rem; padding: 0.75rem;"
          :loading="guardandoPago"
          :disabled="!formularioPagoValido"
          fluid
          @click="guardarPago"
        />
      </div>
    </Dialog>
  </div>
</template>