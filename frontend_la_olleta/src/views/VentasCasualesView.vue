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
import ModalFacturaTicket, { type ComprobanteData } from '../components/ModalFacturaTicket.vue';

interface VentaCasual {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  tipoPlato?: string;
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
const mostrarComprobante = ref(false);
const comprobanteActual = ref<ComprobanteData | null>(null);

type TipoPlato = 'Completo' | 'Solo Segundo' | 'Solo Sopa';
const tiposPlato: TipoPlato[] = ['Completo', 'Solo Segundo', 'Solo Sopa'];

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
const tipoPlatoForm = ref<TipoPlato>('Completo');
const cantidadCompletos = ref<number | null>(1);
const precioUnitario = ref<number | null>(null);
const montoTotal = ref<number | null>(null);

interface ItemPlatoVenta {
  idOpcionMenu: number | null;
  tipoPlato: TipoPlato;
  cantidad: number;
}

const platosVentaForm = ref<ItemPlatoVenta[]>([]);

const agregarPlatoVenta = () => {
  const defaultId =
    todasLasOpciones.value.length > 0 ? (todasLasOpciones.value[0]?.id ?? null) : null;
  platosVentaForm.value.push({
    idOpcionMenu: defaultId,
    tipoPlato: 'Completo',
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
  tipoPlatoForm.value = 'Completo';
  cantidadCompletos.value = 1;
  precioUnitario.value = precioCasualSugerido.value || 18;
  montoTotal.value = null;
  metodoPago.value = 'Efectivo';
  platosVentaForm.value = [{ idOpcionMenu: defaultId, tipoPlato: 'Completo', cantidad: 1 }];
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
  tipoPlatoForm.value = (venta.tipoPlato as any) || 'Completo';
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
    if (tipoPlatoForm.value !== 'Solo Sopa' && !idOpcionMenu.value) {
      errorMensaje.value = 'Seleccione el plato fuerte / opción requerida.';
      return;
    }
    if (!cantidadCompletos.value || !precioUnitario.value) {
      errorMensaje.value = 'Complete todos los campos requeridos.';
      return;
    }

    guardando.value = true;
    errorMensaje.value = '';

    const payload = {
      fecha: convertirFechaISO(fecha.value),
      idOpcionMenu: tipoPlatoForm.value === 'Solo Sopa' ? undefined : idOpcionMenu.value,
      tipoPlato: tipoPlatoForm.value,
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
      if (!item) continue;
      if (item.tipoPlato !== 'Solo Sopa' && !item.idOpcionMenu) {
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

    const itemsParaComprobante = platosVentaForm.value.map((item) => {
      const opc = todasLasOpciones.value.find((o) => o.id === item.idOpcionMenu);
      const nombre = opc?.nombreSegundo || (item.tipoPlato === 'Solo Sopa' ? 'Sopa del Día' : 'Almuerzo del Día');
      return {
        descripcion: `${nombre} (${item.tipoPlato || 'Completo'})`,
        cantidad: Number(item.cantidad),
        precioUnitario: precio,
        subtotal: Number(item.cantidad) * precio,
      };
    });
    const montoCobrado = totalMontoCalculado.value;
    const metodoUsado = metodoPago.value;
    const fechaVentaStr = formatearFecha(fecha.value);

    try {
      for (const item of platosVentaForm.value) {
        await api.post('/ventas-casuales', {
          fecha: convertirFechaISO(fecha.value),
          idOpcionMenu: item.tipoPlato === 'Solo Sopa' ? undefined : item.idOpcionMenu,
          tipoPlato: item.tipoPlato || 'Completo',
          cantidadCompletos: Number(item.cantidad),
          precioUnitario: precio,
          montoTotal: Number(item.cantidad) * precio,
          metodoPago: metodoPago.value,
        });
      }

      visible.value = false;
      limpiarFormulario();
      await cargarVentas();

      comprobanteActual.value = {
        tipo: 'VENTA_CASUAL',
        numeroComprobante: `VEN-${(ventas.value[0]?.id || 1).toString().padStart(5, '0')}`,
        fecha: fechaVentaStr,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clienteNombre: 'Cliente Casual',
        clienteNitCi: 'S/N',
        items: itemsParaComprobante,
        montoTotal: montoCobrado,
        metodoPago: metodoUsado,
      };
      mostrarComprobante.value = true;
    } catch (error) {
      errorMensaje.value = obtenerMensajeError(error);
    } finally {
      guardando.value = false;
    }
  }
};

const abrirComprobanteVenta = (venta: VentaCasual) => {
  const nombrePlato =
    venta.opcionMenu?.nombreSegundo ||
    (venta.tipoPlato === 'Solo Sopa' ? 'Sopa del Día' : 'Almuerzo del Día');
  const desc = `${nombrePlato} (${venta.tipoPlato || 'Completo'})`;
  const fVenta = formatearFecha(venta.fecha);
  const hVenta = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  comprobanteActual.value = {
    tipo: 'VENTA_CASUAL',
    numeroComprobante: `VEN-${venta.id.toString().padStart(5, '0')}`,
    fecha: fVenta,
    hora: hVenta,
    clienteNombre: 'Cliente Casual',
    clienteNitCi: 'S/N',
    items: [
      {
        descripcion: desc,
        cantidad: venta.cantidadCompletos,
        precioUnitario: Number(venta.precioUnitario),
        subtotal: Number(venta.montoTotal),
      },
    ],
    montoTotal: Number(venta.montoTotal),
    metodoPago: venta.metodoPago || 'Efectivo',
  };
  mostrarComprobante.value = true;
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
    <div style="display: flex; justify-content: space-between; align-items: center;">
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
        style="background: #f97316; border-color: #f97316; color: white; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.25rem; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);"
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
            <span
              v-if="slotProps.data.tipoPlato === 'Solo Sopa'"
              style="color: #64748b; font-style: italic; font-weight: 600; font-size: 0.85rem;"
            >
              — (Sin segundo)
            </span>
            <Tag
              v-else
              :value="slotProps.data.opcionMenu?.nombreSegundo || 'Almuerzo del Día'"
              severity="info"
              rounded
            />
          </template>
        </Column>

        <Column header="Tipo" style="width: 140px; text-align: center;">
          <template #body="slotProps">
            <Tag
              v-if="slotProps.data.tipoPlato === 'Solo Sopa'"
              value="Solo Sopa"
              rounded
              icon="pi pi-sparkles"
              style="font-size: 0.78rem; font-weight: 700; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;"
            />
            <Tag
              v-else-if="slotProps.data.tipoPlato === 'Solo Segundo'"
              value="Solo Segundo"
              severity="warn"
              icon="pi pi-minus-circle"
              rounded
              style="font-size: 0.78rem; font-weight: 700;"
            />
            <Tag
              v-else
              value="Completo"
              severity="success"
              icon="pi pi-check-circle"
              rounded
              style="font-size: 0.78rem; font-weight: 700;"
            />
          </template>
        </Column>

        <Column
          field="cantidadCompletos"
          header="Cantidad"
          style="width: 120px; text-align: center; font-weight: 700; color: #0f172a;"
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

        <Column header="Acciones" style="width: 170px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-receipt"
              severity="help"
              text
              rounded
              title="Ver / Imprimir Ticket o Factura"
              style="margin-right: .25rem;"
              @click="abrirComprobanteVenta(slotProps.data)"
            />

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
      :style="{ width: '680px' }"
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
          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Plato Fuerte / Segundo</label>
              <Select
                v-if="tipoPlatoForm !== 'Solo Sopa'"
                v-model="idOpcionMenu"
                :options="todasLasOpciones"
                optionLabel="nombreSegundo"
                optionValue="id"
                placeholder="Seleccione el plato del día..."
                fluid
              />
              <div
                v-else
                style="
                  padding: 0.65rem 0.85rem;
                  background: #f0f9ff;
                  border: 1px dashed #7dd3fc;
                  border-radius: 8px;
                  color: #0369a1;
                  font-size: 0.85rem;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 0.4rem;
                "
              >
                <i class="pi pi-sparkles"></i>
                <span>Sopa del Día (Sin segundo)</span>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Tipo de Plato</label>
              <Select
                v-model="tipoPlatoForm"
                :options="tiposPlato"
                fluid
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Cantidad</label>
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

        <!-- Modo Creación: Múltiples Segundos con Cantidad y Tipo -->
        <div v-else style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-weight: 800; color: #1e293b; font-size: 0.9rem;">
              🍛 Platos Fuertes / Segundos a Vender
            </label>
            <Button
              label="Agregar otro plato"
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
            <div style="flex: 1.4;">Segundo del Menú</div>
            <div style="width: 145px;">Tipo</div>
            <div style="width: 125px; text-align: center;">Cantidad</div>
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
              <div style="flex: 1.4;">
                <Select
                  v-if="item.tipoPlato !== 'Solo Sopa'"
                  v-model="item.idOpcionMenu"
                  :options="todasLasOpciones"
                  optionLabel="nombreSegundo"
                  optionValue="id"
                  placeholder="Seleccione segundo..."
                  fluid
                />
                <div
                  v-else
                  style="
                    padding: 0.65rem 0.85rem;
                    background: #f0f9ff;
                    border: 1px dashed #7dd3fc;
                    border-radius: 8px;
                    color: #0369a1;
                    font-size: 0.85rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                  "
                >
                  <i class="pi pi-sparkles"></i>
                  <span>Sopa del Día</span>
                </div>
              </div>

              <div style="width: 145px;">
                <Select
                  v-model="item.tipoPlato"
                  :options="tiposPlato"
                  fluid
                />
              </div>

              <!-- Selector de Cantidad Cómodo y Visible -->
              <div style="width: 125px; display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.2rem 0.4rem;">
                <Button
                  icon="pi pi-minus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 26px; height: 26px; padding: 0;"
                  :disabled="item.cantidad <= 1"
                  @click="item.cantidad = Math.max(1, item.cantidad - 1)"
                />
                <span style="font-weight: 800; font-size: 1.05rem; color: #1e293b; min-width: 24px; text-align: center;">
                  {{ item.cantidad }}
                </span>
                <Button
                  icon="pi pi-plus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 26px; height: 26px; padding: 0;"
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

    <!-- Modal Comprobante / Factura / Ticket -->
    <ModalFacturaTicket
      v-model:visible="mostrarComprobante"
      :comprobante="comprobanteActual"
    />
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
