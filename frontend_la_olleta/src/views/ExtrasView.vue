<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

import api from '../api/axios';

interface Pensionado {
  nombreCompleto: string;
}

interface Pension {
  id: number;
  estado: string;
  pensionado?: Pensionado;
}

interface Extra {
  id: number;
  fecha: string;
  descripcion: string;
  precio: number | string;
  estadoPago?: string;
  tipoCliente?: string;
  clienteCasual?: string;
  metodoPago?: string;
  pension?: Pension;
}

const extras = ref<Extra[]>([]);
const pensiones = ref<Pension[]>([]);
const busqueda = ref('');
const filtroTipoCliente = ref<'TODOS' | 'PENSIONADO' | 'CASUAL' | 'PENDIENTES'>('TODOS');

// Formulario State
const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const extraId = ref<number | null>(null);
const tipoClienteForm = ref<'PENSIONADO' | 'CASUAL'>('PENSIONADO');
const fecha = ref('');
const descripcion = ref('');
const precio = ref<number | null>(null);
const idPension = ref<number | null>(null);
const clienteCasual = ref('');
const metodoPago = ref('Efectivo');
const estadoPago = ref('PENDIENTE');

const metodosPago = ['Efectivo', 'QR'];
const estadosPago = ['PENDIENTE', 'PAGADO'];

// Confirmación Eliminación
const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const pensionesOpciones = computed(() =>
  pensiones.value
    .filter((p) => p.estado === 'ACTIVA' || p.id === idPension.value)
    .map((pension) => ({
      ...pension,
      descripcion: `${pension.pensionado?.nombreCompleto ?? 'Sin pensionado'} (Pensión #${pension.id})`,
    })),
);

const extrasFiltrados = computed(() => {
  let list = extras.value;

  // Filtro por pestaña/tipo
  if (filtroTipoCliente.value === 'PENSIONADO') {
    list = list.filter((e) => (e.tipoCliente || (e.pension ? 'PENSIONADO' : 'CASUAL')) === 'PENSIONADO');
  } else if (filtroTipoCliente.value === 'CASUAL') {
    list = list.filter((e) => (e.tipoCliente || (e.pension ? 'PENSIONADO' : 'CASUAL')) === 'CASUAL');
  } else if (filtroTipoCliente.value === 'PENDIENTES') {
    list = list.filter((e) => e.estadoPago === 'PENDIENTE');
  }

  // Filtro por texto
  if (!busqueda.value.trim()) return list;
  const q = busqueda.value.toLowerCase().trim();

  return list.filter((extra) => {
    const nombrePensionado = (extra.pension?.pensionado?.nombreCompleto ?? '').toLowerCase();
    const nombreCasual = (extra.clienteCasual ?? '').toLowerCase();
    const desc = (extra.descripcion ?? '').toLowerCase();
    return nombrePensionado.includes(q) || nombreCasual.includes(q) || desc.includes(q);
  });
});

// Resúmenes y métricas
const totalMontoExtras = computed(() =>
  extras.value.reduce((total, extra) => total + Number(extra.precio || 0), 0),
);

const totalExtrasPensionados = computed(() =>
  extras.value
    .filter((e) => (e.tipoCliente || (e.pension ? 'PENSIONADO' : 'CASUAL')) === 'PENSIONADO')
    .reduce((total, extra) => total + Number(extra.precio || 0), 0),
);

const totalExtrasCasuales = computed(() =>
  extras.value
    .filter((e) => (e.tipoCliente || (e.pension ? 'PENSIONADO' : 'CASUAL')) === 'CASUAL')
    .reduce((total, extra) => total + Number(extra.precio || 0), 0),
);

const totalPendientesCobro = computed(() =>
  extras.value
    .filter((e) => e.estadoPago === 'PENDIENTE')
    .reduce((total, extra) => total + Number(extra.precio || 0), 0),
);

const formularioValido = computed(() => {
  if (!fecha.value || !descripcion.value.trim() || precio.value === null || precio.value < 0) {
    return false;
  }
  if (tipoClienteForm.value === 'PENSIONADO') {
    return idPension.value !== null;
  }
  return true;
});

const obtenerMensajeError = (error: unknown) => {
  const posibleError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const mensaje = posibleError.response?.data?.message;

  if (Array.isArray(mensaje)) return mensaje.join('. ');
  return mensaje ?? 'No se pudo completar la operación.';
};

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const convertirFechaISO = (valor: string) => valor.slice(0, 10);

const cargarDatos = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const [extrasResponse, pensionesResponse] = await Promise.all([
      api.get('/extras'),
      api.get('/pensiones'),
    ]);

    extras.value = extrasResponse.data;
    pensiones.value = pensionesResponse.data;
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  extraId.value = null;
  tipoClienteForm.value = 'PENSIONADO';
  fecha.value = obtenerFechaLocal();
  descripcion.value = '';
  precio.value = null;
  idPension.value = null;
  clienteCasual.value = '';
  metodoPago.value = 'Efectivo';
  estadoPago.value = 'PENDIENTE';
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevoExtra = () => {
  limpiarFormulario();
  visible.value = true;
};

const cambiarTipoCliente = (tipo: 'PENSIONADO' | 'CASUAL') => {
  tipoClienteForm.value = tipo;
  if (tipo === 'CASUAL') {
    estadoPago.value = 'PAGADO';
    if (!clienteCasual.value) {
      clienteCasual.value = 'Cliente Casual';
    }
  } else {
    estadoPago.value = 'PENDIENTE';
  }
};

const editarExtra = (extra: Extra) => {
  extraId.value = extra.id;
  fecha.value = extra.fecha.slice(0, 10);
  descripcion.value = extra.descripcion;
  precio.value = Number(extra.precio);
  idPension.value = extra.pension?.id ?? null;
  clienteCasual.value = extra.clienteCasual || '';
  metodoPago.value = extra.metodoPago || 'Efectivo';
  estadoPago.value = extra.estadoPago || 'PENDIENTE';

  const esPensionado = Boolean(extra.pension) || extra.tipoCliente === 'PENSIONADO';
  tipoClienteForm.value = esPensionado ? 'PENSIONADO' : 'CASUAL';

  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const alternarEstadoPago = async (extra: Extra) => {
  const nuevoEstado = extra.estadoPago === 'PAGADO' ? 'PENDIENTE' : 'PAGADO';
  try {
    await api.patch(`/extras/${extra.id}`, { estadoPago: nuevoEstado });
    extra.estadoPago = nuevoEstado;
  } catch (error) {
    console.error(error);
  }
};

const guardarExtra = async () => {
  const desc = descripcion.value.trim();
  if (!desc) {
    errorMensaje.value = 'La descripción del consumo extra es obligatoria.';
    return;
  }
  if (desc.length > 200) {
    errorMensaje.value = 'La descripción del extra no puede superar los 200 caracteres.';
    return;
  }

  if (precio.value === null || precio.value < 0) {
    errorMensaje.value = 'El precio debe ser un monto válido mayor o igual a 0.';
    return;
  }

  if (tipoClienteForm.value === 'PENSIONADO' && !idPension.value) {
    errorMensaje.value = 'Debe seleccionar el pensionado asociado.';
    return;
  }

  const casualNom = clienteCasual.value.trim();
  if (tipoClienteForm.value === 'CASUAL' && casualNom.length > 150) {
    errorMensaje.value = 'El nombre o referencia del cliente no puede superar los 150 caracteres.';
    return;
  }

  guardando.value = true;
  errorMensaje.value = '';

  const payload = {
    fecha: convertirFechaISO(fecha.value),
    descripcion: desc,
    precio: Number(precio.value),
    tipoCliente: tipoClienteForm.value,
    idPension: tipoClienteForm.value === 'PENSIONADO' ? Number(idPension.value) : undefined,
    clienteCasual: tipoClienteForm.value === 'CASUAL' ? (casualNom || 'Cliente Casual') : undefined,
    metodoPago: tipoClienteForm.value === 'CASUAL' ? metodoPago.value : undefined,
    estadoPago: estadoPago.value,
  };

  try {
    if (modoEdicion.value && extraId.value) {
      await api.patch(`/extras/${extraId.value}`, payload);
    } else {
      await api.post('/extras', payload);
    }

    visible.value = false;
    limpiarFormulario();
    await cargarDatos();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    guardando.value = false;
  }
};

const eliminarExtra = async (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este consumo extra? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarExtraConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';

  try {
    await api.delete(`/extras/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarDatos();
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    eliminando.value = false;
  }
};

const formatearFecha = (valor: string) => {
  if (!valor) return '-';
  const dateOnly = valor.slice(0, 10);
  const [y, m, d] = dateOnly.split('-');
  if (!y || !m || !d) return valor;
  const fechaObj = new Date(Number(y), Number(m) - 1, Number(d));
  return new Intl.DateTimeFormat('es-BO').format(fechaObj);
};

const formatearMonto = (monto: number | string) =>
  new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(Number(monto));

const obtenerNombreCliente = (extra: Extra) => {
  if (extra.tipoCliente === 'CASUAL' || !extra.pension) {
    return extra.clienteCasual || 'Cliente Casual';
  }
  return (
    extra.pension?.pensionado?.nombreCompleto ??
    pensiones.value.find((p) => p.id === extra.pension?.id)?.pensionado?.nombreCompleto ??
    'Pensionado'
  );
};

onMounted(cargarDatos);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Consumos Extras
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Registro de adicionales para pensionados (a cuenta de pensión) y clientes casuales (mostrador).
        </p>
      </div>

      <Button
        label="Nuevo Extra"
        icon="pi pi-plus"
        style="background: #f97316; border-color: #f97316; color: white; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.25rem; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);"
        @click="nuevoExtra"
      />
    </div>

    <Message
      v-if="errorMensaje && !visible"
      severity="error"
      :closable="false"
    >
      {{ errorMensaje }}
    </Message>

    <!-- Tarjetas de Resumen -->
    <div class="metricas-grid">
      <!-- Total General -->
      <div class="tarjeta-metrica">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="metrica-label">Total Extras Registrados</span>
          <div style="background: #ffedd5; color: #ea580c; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-shopping-bag" style="font-size: 1.1rem;"></i>
          </div>
        </div>
        <h3 class="metrica-valor" style="color: #ea580c;">{{ formatearMonto(totalMontoExtras) }}</h3>
        <span style="font-size: 0.78rem; color: #78716c;">{{ extras.length }} consumo(s) en total</span>
      </div>

      <!-- Extras Pensionados -->
      <div class="tarjeta-metrica">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="metrica-label">De Pensionados</span>
          <div style="background: #dbeafe; color: #2563eb; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-user" style="font-size: 1.1rem;"></i>
          </div>
        </div>
        <h3 class="metrica-valor" style="color: #1e40af;">{{ formatearMonto(totalExtrasPensionados) }}</h3>
        <span style="font-size: 0.78rem; color: #64748b;">Anotados a cuenta de plan</span>
      </div>

      <!-- Extras Casuales -->
      <div class="tarjeta-metrica">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="metrica-label">De Clientes Casuales</span>
          <div style="background: #dcfce7; color: #16a34a; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-users" style="font-size: 1.1rem;"></i>
          </div>
        </div>
        <h3 class="metrica-valor" style="color: #15803d;">{{ formatearMonto(totalExtrasCasuales) }}</h3>
        <span style="font-size: 0.78rem; color: #16a34a;">Venta directa en mostrador</span>
      </div>

      <!-- Pendientes por Cobrar -->
      <div class="tarjeta-metrica">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span class="metrica-label">Pendientes de Cobro</span>
          <div style="background: #fee2e2; color: #dc2626; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-clock" style="font-size: 1.1rem;"></i>
          </div>
        </div>
        <h3 class="metrica-valor" style="color: #dc2626;">{{ formatearMonto(totalPendientesCobro) }}</h3>
        <span style="font-size: 0.78rem; color: #b91c1c;">Por liquidar</span>
      </div>
    </div>

    <!-- Buscador y Filtros -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      "
    >
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 250px;">
          <i class="pi pi-search" style="color: #94a3b8;"></i>
          <InputText
            v-model="busqueda"
            placeholder="Buscar por pensionado, cliente casual o producto..."
            style="padding: 0.75rem 1rem; flex: 1;"
            fluid
          />
        </div>

        <!-- Filtros Rápidos -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button
            type="button"
            class="boton-filtro"
            :class="{ activo: filtroTipoCliente === 'TODOS' }"
            @click="filtroTipoCliente = 'TODOS'"
          >
            Todos ({{ extras.length }})
          </button>
          <button
            type="button"
            class="boton-filtro"
            :class="{ activo: filtroTipoCliente === 'PENSIONADO' }"
            @click="filtroTipoCliente = 'PENSIONADO'"
          >
            👤 Pensionados
          </button>
          <button
            type="button"
            class="boton-filtro"
            :class="{ activo: filtroTipoCliente === 'CASUAL' }"
            @click="filtroTipoCliente = 'CASUAL'"
          >
            🚶 Casuales
          </button>
          <button
            type="button"
            class="boton-filtro"
            :class="{ activo: filtroTipoCliente === 'PENDIENTES' }"
            @click="filtroTipoCliente = 'PENDIENTES'"
          >
            ⏳ Pendientes
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla Principal -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <DataTable
        :value="extrasFiltrados"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay consumos extras registrados"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <!-- Columna 1: Tipo de Cliente -->
        <Column header="Tipo" style="width: 140px;">
          <template #body="slotProps">
            <Tag
              v-if="(slotProps.data.tipoCliente || (slotProps.data.pension ? 'PENSIONADO' : 'CASUAL')) === 'PENSIONADO'"
              value="Pensionado"
              severity="info"
              icon="pi pi-user"
              style="font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.6rem;"
            />
            <Tag
              v-else
              value="Casual"
              severity="success"
              icon="pi pi-users"
              style="font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.6rem;"
            />
          </template>
        </Column>

        <!-- Columna 2: Cliente / Destinatario -->
        <Column header="Cliente / Destinatario" style="min-width: 200px;">
          <template #body="slotProps">
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              <strong style="color: #1e293b; font-size: 0.92rem;">
                {{ obtenerNombreCliente(slotProps.data) }}
              </strong>

              <span
                v-if="slotProps.data.pension"
                style="font-size: 0.78rem; color: #64748b;"
              >
                Cuenta de Pensión #{{ slotProps.data.pension.id }}
              </span>
              <span
                v-else-if="slotProps.data.metodoPago"
                style="font-size: 0.78rem; color: #059669; font-weight: 600;"
              >
                Pago: {{ slotProps.data.metodoPago }}
              </span>
            </div>
          </template>
        </Column>

        <Column header="Fecha" style="color: #475569; width: 130px;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column
          field="descripcion"
          header="Descripción del Extra"
          style="color: #334155; font-weight: 500; min-width: 200px;"
        />

        <Column header="Precio" style="width: 130px; text-align: right;">
          <template #body="slotProps">
            <span style="font-weight: 800; color: #b45309; font-size: 0.95rem;">
              {{ formatearMonto(slotProps.data.precio) }}
            </span>
          </template>
        </Column>

        <Column header="Estado de Pago" style="width: 160px; text-align: center;">
          <template #body="slotProps">
            <Button
              :label="slotProps.data.estadoPago || 'PENDIENTE'"
              :severity="(slotProps.data.estadoPago || '') === 'PAGADO' ? 'success' : 'warn'"
              :icon="(slotProps.data.estadoPago || '') === 'PAGADO' ? 'pi pi-check' : 'pi pi-clock'"
              size="small"
              rounded
              title="Clic para alternar estado de pago"
              style="padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 700;"
              @click="alternarEstadoPago(slotProps.data)"
            />
          </template>
        </Column>

        <Column header="Acciones" style="width: 120px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              aria-label="Editar extra"
              style="margin-right: .25rem;"
              @click="editarExtra(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar extra"
              @click="eliminarExtra(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo de Formulario -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Consumo Extra' : 'Nuevo Consumo Extra'"
      :style="{ width: '520px' }"
    >
      <div class="formulario">
        <Message
          v-if="errorMensaje"
          severity="error"
          :closable="false"
          style="margin-bottom: 0.5rem;"
        >
          {{ errorMensaje }}
        </Message>

        <!-- Selector Tipo de Cliente -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Tipo de Cliente *</label>
          <div style="display: flex; gap: 0.5rem; background: #f1f5f9; padding: 0.35rem; border-radius: 12px;">
            <button
              type="button"
              :style="tipoClienteForm === 'PENSIONADO' ? 'background: #f97316; color: white; font-weight: 700; box-shadow: 0 2px 6px rgba(249,115,22,0.3);' : 'background: transparent; color: #64748b; font-weight: 600;'"
              style="flex: 1; border: none; padding: 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.88rem;"
              @click="cambiarTipoCliente('PENSIONADO')"
            >
              <i class="pi pi-user" style="margin-right: 0.4rem;"></i> Pensionado
            </button>
            <button
              type="button"
              :style="tipoClienteForm === 'CASUAL' ? 'background: #f97316; color: white; font-weight: 700; box-shadow: 0 2px 6px rgba(249,115,22,0.3);' : 'background: transparent; color: #64748b; font-weight: 600;'"
              style="flex: 1; border: none; padding: 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.88rem;"
              @click="cambiarTipoCliente('CASUAL')"
            >
              <i class="pi pi-users" style="margin-right: 0.4rem;"></i> Cliente Casual
            </button>
          </div>
        </div>

        <!-- Si es Pensionado: Seleccionar Pensión -->
        <div v-if="tipoClienteForm === 'PENSIONADO'" style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Pensión del Cliente *</label>
          <Select
            v-model="idPension"
            :options="pensionesOpciones"
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione el pensionado..."
            fluid
          />
        </div>

        <!-- Si es Casual: Nombre / Referencia y Método de Pago -->
        <div v-if="tipoClienteForm === 'CASUAL'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Nombre / Referencia</label>
            <InputText
              v-model="clienteCasual"
              placeholder="Ej. Mesa 3, Mostrador, Juan"
              maxlength="150"
              style="padding: 0.75rem 1rem;"
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Método de Pago</label>
            <Select
              v-model="metodoPago"
              :options="metodosPago"
              fluid
            />
          </div>
        </div>

        <!-- Fecha y Estado de Pago -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Fecha</label>
            <input
              v-model="fecha"
              type="date"
              class="input-fecha-custom"
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Estado de Pago</label>
            <Select
              v-model="estadoPago"
              :options="estadosPago"
              fluid
            />
          </div>
        </div>

        <!-- Descripción -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Descripción del Extra *</label>
          <InputText
            v-model="descripcion"
            maxlength="200"
            placeholder="Ej. Refresco, porción extra de carne, postre"
            style="padding: 0.75rem 1rem;"
            fluid
          />
          <span style="font-size: 0.75rem; color: #94a3b8; text-align: right;">
            {{ descripcion.length }}/200 caracteres
          </span>
        </div>

        <!-- Precio -->
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Precio (Bs.) *</label>
          <InputNumber
            v-model="precio"
            mode="currency"
            currency="BOB"
            locale="es-BO"
            :min="0"
            placeholder="0.00 Bs."
            fluid
          />
        </div>

        <Button
          :label="modoEdicion ? 'Guardar Cambios' : 'Registrar Consumo Extra'"
          :icon="modoEdicion ? 'pi pi-save' : 'pi pi-check'"
          style="margin-top: 0.5rem; padding: 0.75rem; background: #f97316; border-color: #f97316; color: white; font-weight: 700;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarExtra"
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
            @click="eliminarExtraConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.metricas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.tarjeta-metrica {
  background: white;
  border-radius: 16px;
  border: 1px solid #fed7aa;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metrica-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.metrica-valor {
  margin: 0.35rem 0 0.15rem 0;
  font-size: 1.6rem;
  font-weight: 800;
}

.boton-filtro {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.boton-filtro:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.boton-filtro.activo {
  background: #ea580c;
  border-color: #ea580c;
  color: white;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding-top: 0.5rem;
}

.input-fecha-custom {
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
}

.input-fecha-custom:focus {
  border-color: #f97316;
}
</style>
