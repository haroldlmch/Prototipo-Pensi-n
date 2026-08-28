<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';

import api from '../api/axios';

interface VentaCasual {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  precioUnitario: number | string;
  montoTotal: number | string;
  metodoPago?: string;
  opcionMenu?: {
    id: number;
    nombreSegundo: string;
  };
}

const ventas = ref<VentaCasual[]>([]);
const todasLasOpciones = ref<{ id: number; nombreSegundo: string }[]>([]);
const busquedaFecha = ref<Date | null>(null);
const metodoPago = ref('Efectivo');
const metodosPago = ['Efectivo', 'Pago QR'];

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ventasFiltradas = computed(() => {
  if (!busquedaFecha.value) return ventas.value;
  
  const d = new Date(busquedaFecha.value);
  const fechaSeleccionada = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return ventas.value.filter((venta) => {
    const fechaVenta = (venta.fecha || '').slice(0, 10);
    return fechaVenta === fechaSeleccionada;
  });
});

const visible = ref(false);
const modoEdicion = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const mensajeEliminar = ref('');
const eliminando = ref(false);

const ventaId = ref<number | null>(null);
const fecha = ref('');
const idOpcionMenu = ref<number | null>(null);
const cantidadCompletos = ref<number | null>(1);
const precioUnitario = ref<number | null>(null);
const montoTotal = ref<number | null>(null);

interface ItemPlatoVenta {
  idOpcionMenu: number | null;
  cantidad: number;
}

const platosVentaForm = ref<ItemPlatoVenta[]>([]);

const agregarPlatoVenta = () => {
  const defaultId =
    todasLasOpciones.value.length > 0 ? (todasLasOpciones.value[0]?.id ?? null) : null;
  platosVentaForm.value.push({
    idOpcionMenu: defaultId,
    cantidad: 1,
  });
};

const quitarPlatoVenta = (index: number) => {
  if (platosVentaForm.value.length > 1) {
    platosVentaForm.value.splice(index, 1);
  }
};

const totalPlatosVenta = computed(() => {
  if (modoEdicion.value) return Number(cantidadCompletos.value) || 1;
  return platosVentaForm.value.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
});

const totalMontoCalculado = computed(() => {
  const precio = Number(precioUnitario.value) || 0;
  return totalPlatosVenta.value * precio;
});

const formularioValido = computed(() => {
  if (modoEdicion.value) {
    return (
      Boolean(fecha.value) &&
      cantidadCompletos.value !== null &&
      cantidadCompletos.value >= 1 &&
      precioUnitario.value !== null &&
      precioUnitario.value >= 0
    );
  }
  return (
    Boolean(fecha.value) &&
    platosVentaForm.value.length > 0 &&
    precioUnitario.value !== null &&
    precioUnitario.value >= 0
  );
});

const totalVentas = computed(() =>
  ventas.value.reduce((total, venta) => total + Number(venta.montoTotal), 0),
);

const obtenerMensajeError = (error: unknown) => {
  const posibleError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const mensaje = posibleError.response?.data?.message;

  if (Array.isArray(mensaje)) return mensaje.join('. ');
  return mensaje ?? 'No se pudo completar la operación.';
};

const convertirFechaISO = (valor: string) => valor.slice(0, 10);

const precioCasualSugerido = ref<number | null>(null);

const cargarVentas = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const [ventasResponse, configResponse, menusResponse] = await Promise.all([
      api.get('/ventas-casuales'),
      api.get('/configuracion'),
      api.get('/menus'),
    ]);
    ventas.value = ventasResponse.data;
    const config = Array.isArray(configResponse.data) ? configResponse.data[0] : configResponse.data;
    if (config) {
      precioCasualSugerido.value = Number(config.precioCasual);
    }

    // Obtener menú de hoy para opciones de platos
    const hoyStr = obtenerFechaLocal();
    const mHoy = menusResponse.data.find((m: any) => (m.fecha || '').slice(0, 10) === hoyStr);
    if (mHoy && mHoy.opcionesMenu && mHoy.opcionesMenu.length > 0) {
      todasLasOpciones.value = mHoy.opcionesMenu;
    } else if (menusResponse.data.length > 0) {
      todasLasOpciones.value = menusResponse.data[0].opcionesMenu || [];
    }
  } catch (error) {
    errorMensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  ventaId.value = null;
  fecha.value = obtenerFechaLocal();
  const defaultId = todasLasOpciones.value.length > 0 ? (todasLasOpciones.value[0]?.id ?? null) : null;
  idOpcionMenu.value = defaultId;
  cantidadCompletos.value = 1;
  precioUnitario.value = precioCasualSugerido.value || 18;
  montoTotal.value = null;
  metodoPago.value = 'Efectivo';
  platosVentaForm.value = [{ idOpcionMenu: defaultId, cantidad: 1 }];
  modoEdicion.value = false;
  errorMensaje.value = '';
};

const nuevaVenta = () => {
  limpiarFormulario();
  if (precioCasualSugerido.value !== null) {
    precioUnitario.value = precioCasualSugerido.value;
  }
  visible.value = true;
};

const editarVenta = (venta: VentaCasual) => {
  ventaId.value = venta.id;
  fecha.value = venta.fecha.slice(0, 10);
  idOpcionMenu.value = venta.opcionMenu?.id || null;
  cantidadCompletos.value = venta.cantidadCompletos;
  precioUnitario.value = Number(venta.precioUnitario);
  montoTotal.value = Number(venta.montoTotal);
  metodoPago.value = venta.metodoPago || 'Efectivo';
  modoEdicion.value = true;
  errorMensaje.value = '';
  visible.value = true;
};

const guardarVenta = async () => {
  if (modoEdicion.value) {
    if (!idOpcionMenu.value || !cantidadCompletos.value || !precioUnitario.value) {
      errorMensaje.value = 'Complete todos los campos requeridos.';
      return;
    }

    guardando.value = true;
    errorMensaje.value = '';

    const payload = {
      fecha: convertirFechaISO(fecha.value),
      idOpcionMenu: idOpcionMenu.value,
      cantidadCompletos: Number(cantidadCompletos.value),
      precioUnitario: Number(precioUnitario.value),
      montoTotal: Number(cantidadCompletos.value) * Number(precioUnitario.value),
      metodoPago: metodoPago.value,
    };

    try {
      if (ventaId.value) {
        await api.patch(`/ventas-casuales/${ventaId.value}`, payload);
      }
      visible.value = false;
      limpiarFormulario();
      await cargarVentas();
    } catch (error) {
      errorMensaje.value = obtenerMensajeError(error);
    } finally {
      guardando.value = false;
    }
  } else {
    // Validar lista de platos múltiples
    if (platosVentaForm.value.length === 0) {
      errorMensaje.value = 'Agregue al menos un plato a la lista.';
      return;
    }

    for (let i = 0; i < platosVentaForm.value.length; i++) {
      const item = platosVentaForm.value[i];
      if (!item || !item.idOpcionMenu) {
        errorMensaje.value = `Seleccione el plato en la fila #${i + 1}.`;
        return;
      }
      if (!item.cantidad || item.cantidad <= 0) {
        errorMensaje.value = `Indique una cantidad válida en la fila #${i + 1}.`;
        return;
      }
    }

    const precio = Number(precioUnitario.value) || 0;

    guardando.value = true;
    errorMensaje.value = '';

    try {
      for (const item of platosVentaForm.value) {
        await api.post('/ventas-casuales', {
          fecha: convertirFechaISO(fecha.value),
          idOpcionMenu: item.idOpcionMenu,
          cantidadCompletos: Number(item.cantidad),
          precioUnitario: precio,
          montoTotal: Number(item.cantidad) * precio,
          metodoPago: metodoPago.value,
        });
      }

      visible.value = false;
      limpiarFormulario();
      await cargarVentas();
    } catch (error) {
      errorMensaje.value = obtenerMensajeError(error);
    } finally {
      guardando.value = false;
    }
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mensajeEliminar.value = '¿Desea eliminar este registro de venta casual? Esta acción no se puede deshacer.';
  mostrarConfirmarEliminar.value = true;
};

const eliminarVentaConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  errorMensaje.value = '';
  try {
    await api.delete(`/ventas-casuales/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarVentas();
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

watch([cantidadCompletos, precioUnitario], () => {
  if (cantidadCompletos.value === null || precioUnitario.value === null) {
    montoTotal.value = null;
    return;
  }

  montoTotal.value = cantidadCompletos.value * precioUnitario.value;
});

onMounted(cargarVentas);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
      <div>
        <h1 style="margin: 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">
          Ventas Casuales
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Registro de comidas despachadas directamente en el mostrador a clientes casuales.
        </p>
      </div>

      <Button
        label="Nueva Venta"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevaVenta"
      />
    </div>

    <!-- Indicador de total registrado -->
    <div class="resumen-card">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="background: #d1fae5; color: #059669; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-money-bill" style="font-size: 1.35rem;"></i>
        </div>
        <div>
          <span style="color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Registrado</span>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 800; color: #059669;">
            {{ formatearMonto(totalVentas) }}
          </h2>
        </div>
      </div>
    </div>

    <Message
      v-if="errorMensaje && !visible"
      severity="error"
      :closable="false"
      class="mensaje"
    >
      {{ errorMensaje }}
    </Message>

    <!-- Buscador -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      "
    >
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="pi pi-calendar" style="color: #94a3b8;"></i>
        <Calendar
          v-model="busquedaFecha"
          dateFormat="dd/mm/yy"
          placeholder="Seleccionar fecha..."
          style="flex: 1;"
          showIcon
        />
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
        :value="ventasFiltradas"
        stripedRows
        paginator
        :rows="10"
        dataKey="id"
        emptyMessage="No hay ventas casuales registradas"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >

        <Column header="Fecha" style="color: #475569; font-weight: 600; width: 140px;">
          <template #body="slotProps">
            {{ formatearFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column header="Plato / Segundo" style="color: #334155; font-weight: 600;">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.opcionMenu?.nombreSegundo || 'Almuerzo del Día'"
              severity="info"
              rounded
            />
          </template>
        </Column>

        <Column
          field="cantidadCompletos"
          header="Completos Vendidos"
          style="width: 150px; text-align: center; font-weight: 700; color: #0f172a;"
        />

        <Column header="Precio Unitario" style="width: 150px; text-align: right;">
          <template #body="slotProps">
            {{ formatearMonto(slotProps.data.precioUnitario) }}
          </template>
        </Column>

        <Column header="Monto Total" style="width: 170px; text-align: right;">
          <template #body="slotProps">
            <span style="font-weight: 800; color: #059669; font-size: 1rem;">
              {{ formatearMonto(slotProps.data.montoTotal) }}
            </span>
          </template>
        </Column>

        <Column header="Método" style="width: 130px; text-align: center;">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.metodoPago || 'Efectivo'"
              :severity="
                (slotProps.data.metodoPago || '').includes('QR')
                  ? 'info'
                  : (slotProps.data.metodoPago || '').includes('Transf')
                  ? 'warn'
                  : 'success'
              "
              rounded
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
              aria-label="Editar venta casual"
              style="margin-right: .25rem;"
              @click="editarVenta(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Eliminar venta casual"
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
      :header="modoEdicion ? 'Editar Venta Casual' : 'Nueva Venta Casual / Múltiples Platos'"
      :style="{ width: '640px' }"
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

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <!-- Fecha Automática No Editable -->
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Fecha</label>
            <div
              style="
                width: 100%;
                padding: 0.65rem 0.85rem;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                color: #475569;
                font-weight: 600;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-sizing: border-box;
              "
            >
              <i class="pi pi-calendar" style="color: #64748b;"></i>
              <span>{{ formatearFecha(fecha) || 'Hoy' }}</span>
            </div>
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

        <!-- Modo Edición: Formulario Simple -->
        <div v-if="modoEdicion" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Plato Fuerte / Segundo *</label>
            <Select
              v-model="idOpcionMenu"
              :options="todasLasOpciones"
              optionLabel="nombreSegundo"
              optionValue="id"
              placeholder="Seleccione el plato del día..."
              fluid
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Cantidad de Completos</label>
              <InputNumber
                v-model="cantidadCompletos"
                :min="1"
                showButtons
                fluid
              />
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Precio Unitario</label>
              <InputNumber
                v-model="precioUnitario"
                mode="currency"
                currency="BOB"
                locale="es-BO"
                :min="0"
                fluid
              />
            </div>
          </div>
        </div>

        <!-- Modo Creación: Múltiples Segundos con Cantidad -->
        <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">
              🍛 Platos Fuertes / Segundos a Vender
            </label>
            <Button
              label="Agregar otro segundo"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              outlined
              style="font-size: 0.75rem; padding: 0.35rem 0.65rem;"
              @click="agregarPlatoVenta"
            />
          </div>

          <!-- Cabeceras de columnas -->
          <div style="display: flex; gap: 0.75rem; padding: 0 0.5rem; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
            <div style="flex: 1;">Segundo del Menú</div>
            <div style="width: 140px; text-align: center;">Cantidad</div>
            <div style="width: 36px;"></div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 250px; overflow-y: auto; padding-right: 0.25rem;">
            <div
              v-for="(item, idx) in platosVentaForm"
              :key="idx"
              style="
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 0.6rem 0.75rem;
              "
            >
              <div style="flex: 1;">
                <Select
                  v-model="item.idOpcionMenu"
                  :options="todasLasOpciones"
                  optionLabel="nombreSegundo"
                  optionValue="id"
                  placeholder="Seleccione segundo..."
                  fluid
                />
              </div>

              <!-- Selector de Cantidad Cómodo y Visible -->
              <div style="width: 140px; display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.2rem 0.4rem;">
                <Button
                  icon="pi pi-minus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 28px; height: 28px; padding: 0;"
                  :disabled="item.cantidad <= 1"
                  @click="item.cantidad = Math.max(1, item.cantidad - 1)"
                />
                <span style="font-weight: 800; font-size: 1.1rem; color: #1e293b; min-width: 28px; text-align: center;">
                  {{ item.cantidad }}
                </span>
                <Button
                  icon="pi pi-plus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 28px; height: 28px; padding: 0;"
                  :disabled="item.cantidad >= 10"
                  @click="item.cantidad = Math.min(10, item.cantidad + 1)"
                />
              </div>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                :disabled="platosVentaForm.length <= 1"
                title="Quitar este plato"
                @click="quitarPlatoVenta(idx)"
              />
            </div>
          </div>

          <!-- Resumen de Cobro -->
          <div
            style="
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 1.5px solid #86efac;
              border-radius: 12px;
              padding: 0.85rem 1.25rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <div>
              <div style="font-size: 0.82rem; color: #166534; font-weight: 700; text-transform: uppercase;">
                {{ totalPlatosVenta }} plato(s) a {{ formatearMonto(precioUnitario || 0) }} c/u
              </div>
              <div style="font-size: 0.75rem; color: #15803d;">
                Método de cobro: <strong>{{ metodoPago }}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: #166534; font-weight: 600;">Total a Cobrar:</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #14532d;">
                {{ formatearMonto(totalMontoCalculado) }}
              </div>
            </div>
          </div>
        </div>

        <Button
          :label="modoEdicion ? 'Actualizar Venta' : `Registrar Venta (Cobrar ${formatearMonto(totalMontoCalculado)})`"
          icon="pi pi-check"
          severity="success"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 700;"
          :loading="guardando"
          :disabled="!formularioValido"
          fluid
          @click="guardarVenta"
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
            @click="eliminarVentaConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.resumen-card {
  max-width: 320px;
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  border-color: #3b82f6;
}
</style>
