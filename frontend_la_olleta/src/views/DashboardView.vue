<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

import api from '../api/axios';
import ModalFacturaTicket, { type ComprobanteData } from '../components/ModalFacturaTicket.vue';

const router = useRouter();

const getFechaLocalStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const cargando = ref(true);

const resumen = ref({
  pensionadosActivos: 0,
  pensionesActivas: 0,
  consumosRegistrados: 0,
  ventasCasuales: 0,
  totalIngresosHistorico: 0,
});

const cierre = ref({
  fecha: getFechaLocalStr(),
  gananciaDirectaHoy: 0,
  totalIngresosHoy: 0,
  totalPagos: 0,
  totalVentas: 0,
  totalExtras: 0,
  totalComidasServidasHoy: 0,
  totalPlatosPensionados: 0,
  totalPlatosCasuales: 0,
  desgloseMetodos: {
    efectivo: 0,
    qr: 0,
  },
});

const menuHoy = ref<{
  id: number;
  fecha: string;
  sopa: string;
  cantidadSopaInicial?: number;
  cantidadSopaDisponible?: number;
  opcionesMenu?: {
    id: number;
    nombreSegundo: string;
    cantidadInicial: number;
    cantidadDisponible: number;
  }[];
} | null>(null);

const ultimosConsumos = ref<any[]>([]);
const ultimosPagos = ref<any[]>([]);
const alertas = ref<any[]>([]);

// Pestaña activa para la sección de actividad reciente
const tabActividad = ref<'consumos' | 'pagos'>('consumos');

// =================== ESTADO Y LÓGICA DE NUEVA VENTA CASUAL EMBEBIDA ===================
const mostrarModalVenta = ref(false);
const fechaVenta = ref(getFechaLocalStr());
const metodoPagoVenta = ref('Efectivo');
const metodosPago = ['Efectivo', 'QR'];
const tiposPlato = ['Completo', 'Solo Segundo', 'Solo Sopa'];
const precioCasualCompleto = ref(18);
const precioCasualSegundo = ref(15);
const precioCasualSopa = ref(10);
const todasLasOpcionesMenu = ref<any[]>([]);
const platosVentaForm = ref<
  Array<{
    idOpcionMenu: number | null;
    tipoPlato: string;
    cantidad: number;
    precioUnitario: number;
  }>
>([]);
const guardandoVenta = ref(false);
const errorMensajeVenta = ref('');

// Comprobante
const mostrarComprobante = ref(false);
const comprobanteActual = ref<ComprobanteData | null>(null);

const obtenerPrecioPorTipo = (tipo?: string) => {
  if (tipo === 'Solo Segundo') return precioCasualSegundo.value;
  if (tipo === 'Solo Sopa') return precioCasualSopa.value;
  return precioCasualCompleto.value;
};

const onTipoPlatoChange = (item: { tipoPlato: string; precioUnitario: number; idOpcionMenu: number | null }) => {
  item.precioUnitario = obtenerPrecioPorTipo(item.tipoPlato);
  if (item.tipoPlato === 'Solo Sopa') {
    item.idOpcionMenu = null;
  } else if (!item.idOpcionMenu && todasLasOpcionesMenu.value.length > 0) {
    item.idOpcionMenu = todasLasOpcionesMenu.value[0]?.id ?? null;
  }
};

const agregarPlatoVenta = () => {
  const defaultId = todasLasOpcionesMenu.value.length > 0 ? todasLasOpcionesMenu.value[0]?.id ?? null : null;
  platosVentaForm.value.push({
    idOpcionMenu: defaultId,
    tipoPlato: 'Completo',
    cantidad: 1,
    precioUnitario: precioCasualCompleto.value,
  });
};

const quitarPlatoVenta = (index: number) => {
  if (platosVentaForm.value.length > 1) {
    platosVentaForm.value.splice(index, 1);
  }
};

const totalPlatosVenta = computed(() => {
  return platosVentaForm.value.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
});

const totalMontoCalculado = computed(() => {
  return platosVentaForm.value.reduce((sum, item) => {
    const cant = Number(item.cantidad) || 0;
    const precio = Number(item.precioUnitario) || 0;
    return sum + cant * precio;
  }, 0);
});

const formularioVentaValido = computed(() => {
  return (
    Boolean(fechaVenta.value) &&
    platosVentaForm.value.length > 0 &&
    platosVentaForm.value.every((p) => p.precioUnitario !== null && p.precioUnitario >= 0 && Number(p.cantidad) >= 1)
  );
});

const abrirModalNuevaVenta = async () => {
  errorMensajeVenta.value = '';
  fechaVenta.value = getFechaLocalStr();
  metodoPagoVenta.value = 'Efectivo';

  try {
    const [configRes, menuRes] = await Promise.all([
      api.get('/configuracion'),
      api.get(`/menus/fecha/${getFechaLocalStr()}`),
    ]);
    const config = Array.isArray(configRes.data) ? configRes.data[0] : configRes.data;
    if (config) {
      precioCasualCompleto.value = Number(config.precioCasual) || 18;
      precioCasualSegundo.value = config.precioCasualSegundo !== undefined ? Number(config.precioCasualSegundo) : 15;
      precioCasualSopa.value = config.precioCasualSopa !== undefined ? Number(config.precioCasualSopa) : 10;
    }
    if (menuRes.data && menuRes.data.opcionesMenu) {
      todasLasOpcionesMenu.value = menuRes.data.opcionesMenu;
    } else if (menuHoy.value && menuHoy.value.opcionesMenu) {
      todasLasOpcionesMenu.value = menuHoy.value.opcionesMenu;
    }
  } catch (e) {
    console.error(e);
  }

  const defaultId = todasLasOpcionesMenu.value.length > 0 ? todasLasOpcionesMenu.value[0]?.id ?? null : null;
  platosVentaForm.value = [
    {
      idOpcionMenu: defaultId,
      tipoPlato: 'Completo',
      cantidad: 1,
      precioUnitario: precioCasualCompleto.value,
    },
  ];
  mostrarModalVenta.value = true;
};

const guardarVenta = async () => {
  if (!formularioVentaValido.value) return;

  guardandoVenta.value = true;
  errorMensajeVenta.value = '';

  const itemsParaComprobante = platosVentaForm.value.map((item) => {
    const precioItem = Number(item.precioUnitario) || obtenerPrecioPorTipo(item.tipoPlato);
    if (item.tipoPlato === 'Solo Sopa') {
      const descSopa = menuHoy.value?.sopa ? `Sopa del Día (${menuHoy.value.sopa})` : 'Sopa del Día';
      return {
        descripcion: descSopa,
        cantidad: Number(item.cantidad),
        precioUnitario: precioItem,
        subtotal: Number(item.cantidad) * precioItem,
        idOpcionMenu: undefined,
        tipoPlato: 'Solo Sopa',
      };
    }
    const opc = todasLasOpcionesMenu.value.find((o) => o.id === item.idOpcionMenu);
    const nombre = opc?.nombreSegundo || 'Almuerzo del Día';
    return {
      descripcion: `${nombre} (${item.tipoPlato || 'Completo'})`,
      cantidad: Number(item.cantidad),
      precioUnitario: precioItem,
      subtotal: Number(item.cantidad) * precioItem,
      idOpcionMenu: item.idOpcionMenu,
      tipoPlato: item.tipoPlato,
    };
  });
  const totalPlatos = totalPlatosVenta.value;
  const montoCobrado = totalMontoCalculado.value;
  const metodoUsado = metodoPagoVenta.value;
  const primerTipo = platosVentaForm.value[0]?.tipoPlato || 'Completo';
  const todosMismoTipo = platosVentaForm.value.every((p) => p.tipoPlato === primerTipo);
  const tipoFinal = todosMismoTipo ? primerTipo : 'Múltiple';
  const precioPromedioOPrimero =
    platosVentaForm.value.length === 1
      ? Number(platosVentaForm.value[0]?.precioUnitario) || obtenerPrecioPorTipo(primerTipo)
      : montoCobrado / (totalPlatos || 1);

  try {
    const res = await api.post('/ventas-casuales', {
      fecha: fechaVenta.value.slice(0, 10),
      cantidadCompletos: totalPlatos,
      precioUnitario: precioPromedioOPrimero,
      montoTotal: montoCobrado,
      tipoPlato: tipoFinal,
      metodoPago: metodoUsado,
      idOpcionMenu:
        platosVentaForm.value[0]?.tipoPlato === 'Solo Sopa'
          ? undefined
          : platosVentaForm.value[0]?.idOpcionMenu || undefined,
      detalleItems: JSON.stringify(itemsParaComprobante),
      items: platosVentaForm.value.map((it) => ({
        idOpcionMenu: it.tipoPlato === 'Solo Sopa' ? undefined : it.idOpcionMenu,
        tipoPlato: it.tipoPlato,
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
      })),
    });

    mostrarModalVenta.value = false;
    await cargarDatosDashboard();

    // Abrir comprobante
    const idVenta = res.data?.id || 1;
    const hVenta = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    comprobanteActual.value = {
      tipo: 'VENTA_CASUAL',
      numeroComprobante: `VEN-${idVenta.toString().padStart(5, '0')}`,
      fecha: formatFecha(fechaVenta.value),
      hora: hVenta,
      clienteNombre: 'Cliente Casual',
      clienteNitCi: 'S/N',
      items: itemsParaComprobante,
      montoTotal: montoCobrado,
      metodoPago: metodoUsado,
    };
    mostrarComprobante.value = true;
  } catch (error: any) {
    const msg = error.response?.data?.message;
    errorMensajeVenta.value = Array.isArray(msg) ? msg.join('. ') : msg || 'No se pudo registrar la venta.';
  } finally {
    guardandoVenta.value = false;
  }
};

// =================== ESTADO Y LÓGICA DE PLANIFICAR MENÚ EMBEBIDO ===================
const mostrarModalMenu = ref(false);
const modoEdicionMenu = ref(false);
const menuFormId = ref<number | null>(null);
const fechaMenuForm = ref(getFechaLocalStr());
const sopaMenuForm = ref('');
const cantidadSopaInicialForm = ref<number | null>(null);
const cantidadSopaDisponibleForm = ref<number | null>(null);
const originalSopaInicial = ref<number>(0);
const originalSopaDisponible = ref<number>(0);
const listaOpcionesMenuForm = ref<
  Array<{
    id?: number;
    nombreSegundo: string;
    cantidadInicial: number;
    cantidadDisponible?: number;
    _originalInicial?: number;
    _originalDisponible?: number;
  }>
>([]);
const nuevaOpcionTexto = ref('');
const nuevaOpcionRaciones = ref<number | null>(null);
const guardandoMenu = ref(false);
const errorMensajeMenu = ref('');

const abrirModalPlanificarMenu = () => {
  errorMensajeMenu.value = '';
  nuevaOpcionTexto.value = '';
  nuevaOpcionRaciones.value = null;

  if (menuHoy.value && menuHoy.value.id) {
    // Si ya existe menú de hoy, cargamos para editar
    modoEdicionMenu.value = true;
    menuFormId.value = menuHoy.value.id;
    fechaMenuForm.value = (menuHoy.value.fecha || getFechaLocalStr()).slice(0, 10);
    sopaMenuForm.value = menuHoy.value.sopa || '';
    const sIni = menuHoy.value.cantidadSopaInicial || 0;
    const sDisp = menuHoy.value.cantidadSopaDisponible !== undefined ? menuHoy.value.cantidadSopaDisponible : sIni;
    cantidadSopaInicialForm.value = sIni || null;
    cantidadSopaDisponibleForm.value = sDisp;
    originalSopaInicial.value = sIni;
    originalSopaDisponible.value = sDisp;

    listaOpcionesMenuForm.value = (menuHoy.value.opcionesMenu || []).map((op) => {
      const cIni = op.cantidadInicial || 0;
      const cDisp = op.cantidadDisponible !== undefined ? op.cantidadDisponible : cIni;
      return {
        id: op.id,
        nombreSegundo: op.nombreSegundo,
        cantidadInicial: cIni,
        cantidadDisponible: cDisp,
        _originalInicial: cIni,
        _originalDisponible: cDisp,
      };
    });
  } else {
    // Nuevo menú para hoy
    modoEdicionMenu.value = false;
    menuFormId.value = null;
    fechaMenuForm.value = getFechaLocalStr();
    sopaMenuForm.value = '';
    cantidadSopaInicialForm.value = null;
    cantidadSopaDisponibleForm.value = null;
    originalSopaInicial.value = 0;
    originalSopaDisponible.value = 0;
    listaOpcionesMenuForm.value = [];
  }
  mostrarModalMenu.value = true;
};

const agregarOpcionMenu = () => {
  if (!nuevaOpcionTexto.value.trim()) return;
  const yaExiste = listaOpcionesMenuForm.value.some(
    (op) => op.nombreSegundo.toLowerCase() === nuevaOpcionTexto.value.trim().toLowerCase(),
  );
  if (yaExiste) {
    errorMensajeMenu.value = 'Esta opción de segundo ya fue agregada.';
    return;
  }
  const raciones = nuevaOpcionRaciones.value ? Number(nuevaOpcionRaciones.value) : 0;
  listaOpcionesMenuForm.value.push({
    nombreSegundo: nuevaOpcionTexto.value.trim(),
    cantidadInicial: raciones,
    cantidadDisponible: raciones,
    _originalInicial: raciones,
    _originalDisponible: raciones,
  });
  nuevaOpcionTexto.value = '';
  nuevaOpcionRaciones.value = null;
  errorMensajeMenu.value = '';
};

const eliminarOpcionMenu = (index: number) => {
  listaOpcionesMenuForm.value.splice(index, 1);
};

const guardarMenu = async () => {
  errorMensajeMenu.value = '';
  const sopaTexto = sopaMenuForm.value.trim();

  if (!sopaTexto) {
    errorMensajeMenu.value = 'Debe indicar la sopa del día.';
    return;
  }
  if (sopaTexto.length > 150) {
    errorMensajeMenu.value = 'El nombre de la sopa no puede superar los 150 caracteres.';
    return;
  }
  if (listaOpcionesMenuForm.value.length === 0) {
    errorMensajeMenu.value = 'Debe agregar al menos una opción de plato fuerte (segundo).';
    return;
  }

  guardandoMenu.value = true;
  try {
    const racionesSopa = cantidadSopaInicialForm.value ? Number(cantidadSopaInicialForm.value) : 0;
    let sopaDisp =
      cantidadSopaDisponibleForm.value !== null && cantidadSopaDisponibleForm.value !== undefined
        ? Number(cantidadSopaDisponibleForm.value)
        : racionesSopa;
    if (sopaDisp > racionesSopa) sopaDisp = racionesSopa;
    if (racionesSopa > 0 && sopaDisp <= 0 && (!modoEdicionMenu.value || originalSopaInicial.value === 0)) {
      sopaDisp = racionesSopa;
    }

    const payload = {
      fecha: fechaMenuForm.value.slice(0, 10),
      sopa: sopaTexto,
      cantidadSopaInicial: racionesSopa,
      cantidadSopaDisponible: sopaDisp,
      opciones: listaOpcionesMenuForm.value.map((op) => {
        const cIni = Number(op.cantidadInicial) || 0;
        let cDisp =
          op.cantidadDisponible !== undefined && op.cantidadDisponible !== null
            ? Number(op.cantidadDisponible)
            : cIni;
        if (cDisp > cIni) cDisp = cIni;
        if (cIni > 0 && cDisp <= 0 && (!modoEdicionMenu.value || (op._originalInicial || 0) === 0)) {
          cDisp = cIni;
        }
        return {
          id: op.id,
          nombreSegundo: op.nombreSegundo,
          cantidadInicial: cIni,
          cantidadDisponible: cDisp,
        };
      }),
    };

    if (modoEdicionMenu.value && menuFormId.value) {
      await api.patch(`/menus/${menuFormId.value}`, payload);
    } else {
      await api.post('/menus', payload);
    }

    mostrarModalMenu.value = false;
    await cargarDatosDashboard();
  } catch (error: any) {
    const msg = error.response?.data?.message;
    errorMensajeMenu.value = Array.isArray(msg) ? msg.join('. ') : msg || 'Error al guardar el menú del día.';
  } finally {
    guardandoMenu.value = false;
  }
};

const cargarDatosDashboard = async () => {
  try {
    cargando.value = true;
    const fechaHoy = getFechaLocalStr();

    const [resumenRes, cierreRes, consumosRes, pagosRes, alertasRes, menuRes] =
      await Promise.allSettled([
        api.get('/dashboard/resumen'),
        api.get('/dashboard/cierre-caja', { params: { fecha: fechaHoy } }),
        api.get('/dashboard/ultimos-consumos'),
        api.get('/dashboard/ultimos-pagos'),
        api.get('/dashboard/alertas'),
        api.get(`/menus/fecha/${fechaHoy}`),
      ]);

    if (resumenRes.status === 'fulfilled') resumen.value = resumenRes.value.data;
    if (cierreRes.status === 'fulfilled') cierre.value = cierreRes.value.data;
    if (consumosRes.status === 'fulfilled') ultimosConsumos.value = consumosRes.value.data;
    if (pagosRes.status === 'fulfilled') ultimosPagos.value = pagosRes.value.data;
    if (alertasRes.status === 'fulfilled') alertas.value = alertasRes.value.data;
    if (menuRes.status === 'fulfilled' && menuRes.value.data && menuRes.value.data.id) {
      menuHoy.value = menuRes.value.data;
      if (menuRes.value.data.opcionesMenu) {
        todasLasOpcionesMenu.value = menuRes.value.data.opcionesMenu;
      }
    } else {
      menuHoy.value = null;
    }
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
  } finally {
    cargando.value = false;
  }
};

const navegar = (ruta: string) => {
  router.push(ruta);
};

const irACobro = (pensionId: number) => {
  router.push({
    path: '/pagos',
    query: { nuevoPago: 'true', idPension: String(pensionId) },
  });
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const [year, month, day] = fechaStr.slice(0, 10).split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
};

const formatHora = (fechaStr: string) => {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDinero = (monto: any) => {
  const num = Number(monto);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Porcentaje de platos restantes para las barras de progreso
const calcularPorcentaje = (disp: number, inicial: number) => {
  if (!inicial || inicial <= 0) return 0;
  const p = Math.round((disp / inicial) * 100);
  return Math.min(100, Math.max(0, p));
};

// Paleta de colores armoniosos y distintivos para cada plato de segundo
const COLORES_PLATOS = [
  {
    tagBg: '#ecfdf5',
    tagColor: '#047857',
    barGrad: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
  },
  {
    tagBg: '#eff6ff',
    tagColor: '#1d4ed8',
    barGrad: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
  },
  {
    tagBg: '#fff7ed',
    tagColor: '#c2410c',
    barGrad: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
  },
  {
    tagBg: '#f5f3ff',
    tagColor: '#6d28d9',
    barGrad: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
  },
  {
    tagBg: '#ecfeff',
    tagColor: '#0e7490',
    barGrad: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
  },
  {
    tagBg: '#fdf2f8',
    tagColor: '#be185d',
    barGrad: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)',
  },
];

const getColorPlato = (index: number): { tagBg: string; tagColor: string; barGrad: string } => {
  const safeIdx = Math.abs(index) % COLORES_PLATOS.length;
  return (
    COLORES_PLATOS[safeIdx] ?? {
      tagBg: '#eff6ff',
      tagColor: '#1d4ed8',
      barGrad: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
    }
  );
};

onMounted(() => {
  cargarDatosDashboard();
});
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- HEADER Y ACCIONES RÁPIDAS -->
    <div class="dashboard-header">
      <div>
        <h1 class="titulo-principal">Panel de Control</h1>
        <p class="subtitulo">
          Monitoreo en tiempo real del restaurante: menú, platos, caja y pensiones.
        </p>
      </div>

      <!-- Barra de Acciones Rápidas -->
      <div class="acciones-rapidas">
        <Button
          label="Registrar Consumo"
          icon="pi pi-check-circle"
          severity="success"
          raised
          class="btn-accion-destacado"
          @click="navegar('/consumos')"
        />
        <Button
          label="Venta Casual"
          icon="pi pi-shopping-bag"
          severity="warn"
          outlined
          @click="abrirModalNuevaVenta"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          :loading="cargando"
          title="Actualizar datos"
          @click="cargarDatosDashboard"
        />
      </div>
    </div>

    <!-- TARJETAS KPIS PRINCIPALES DEL DÍA -->
    <div class="kpis-grid">
      <!-- KPI 1: Platos Servidos Hoy -->
      <div class="kpi-card kpi-orange">
        <div class="kpi-icon-container bg-orange-light">
          <i class="pi pi-calendar-clock text-orange-dark"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Almuerzos Servidos Hoy</span>
          <div class="kpi-value">{{ cierre.totalComidasServidasHoy }} <span class="kpi-unit">platos</span></div>
          <div class="kpi-subtext">
            <span><strong>{{ cierre.totalPlatosPensionados }}</strong> pensionados</span>
            <span class="punto-separador">•</span>
            <span><strong>{{ cierre.totalPlatosCasuales }}</strong> casuales</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Recaudación en Caja Hoy -->
      <div class="kpi-card kpi-emerald">
        <div class="kpi-icon-container bg-emerald-light">
          <i class="pi pi-wallet text-emerald-dark"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Recaudación en Caja (Hoy)</span>
          <div class="kpi-value text-emerald-dark">Bs. {{ formatDinero(cierre.totalIngresosHoy) }}</div>
          <div class="kpi-subtext">
            <span>Efectivo: Bs. {{ formatDinero(cierre.desgloseMetodos.efectivo) }}</span>
            <span class="punto-separador">•</span>
            <span>QR: Bs. {{ formatDinero(cierre.desgloseMetodos.qr) }}</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Pensionados Activos -->
      <div class="kpi-card kpi-indigo" @click="navegar('/pensionados')">
        <div class="kpi-icon-container bg-indigo-light">
          <i class="pi pi-users text-indigo-dark"></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Pensionados Activos</span>
          <div class="kpi-value">{{ resumen.pensionadosActivos }} <span class="kpi-unit">clientes</span></div>
          <div class="kpi-subtext text-indigo-dark">
            {{ resumen.pensionesActivas }} planes con saldo activo
          </div>
        </div>
      </div>

      <!-- KPI 4: Alertas de Renovación -->
      <div class="kpi-card" :class="alertas.length > 0 ? 'kpi-rose' : 'kpi-slate'">
        <div class="kpi-icon-container" :class="alertas.length > 0 ? 'bg-rose-light' : 'bg-slate-light'">
          <i
            class="pi"
            :class="alertas.length > 0 ? 'pi-exclamation-triangle text-rose-dark' : 'pi-check text-slate-dark'"
          ></i>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Alertas de Renovación</span>
          <div class="kpi-value" :class="alertas.length > 0 ? 'text-rose-dark' : 'text-slate-dark'">
            {{ alertas.length }} <span class="kpi-unit">por renovar</span>
          </div>
          <div class="kpi-subtext">
            <span v-if="alertas.length > 0">
              {{ alertas.filter(a => a.completosDisponibles <= 0).length }} agotadas •
              {{ alertas.filter(a => a.completosDisponibles > 0).length }} saldo bajo
            </span>
            <span v-else class="text-emerald-dark">
              Todos los clientes con saldo
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- SECCIÓN OPERATIVA CENTRAL (2 COLUMNAS) -->
    <div class="seccion-central-grid">
      <!-- COLUMNA 1: MENÚ Y STOCK DE HOY EN VIVO -->
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="panel-titulo-box">
            <div class="panel-icon bg-orange-light">
              <i class="pi pi-clipboard text-orange-dark"></i>
            </div>
            <div>
              <h2 class="panel-titulo">Menú de Hoy y Platos en Cocina</h2>
              <p class="panel-subtitulo">Disponibilidad en tiempo real</p>
            </div>
          </div>
          <Button
            label="Planificar Menú"
            icon="pi pi-pencil"
            size="small"
            severity="warn"
            style="font-weight: 700; border-radius: 8px; padding: 0.45rem 0.85rem;"
            @click="abrirModalPlanificarMenu"
          />
        </div>

        <div v-if="menuHoy" class="menu-hoy-container">
          <!-- Sopa del Día -->
          <div class="item-menu-stock">
            <div class="item-menu-info">
              <div class="item-nombre-badge">
                <span class="tipo-plato-tag sopa-tag">🍲 Sopa</span>
                <span class="nombre-plato">{{ menuHoy.sopa || 'Sopa del día' }}</span>
              </div>
              <div class="stock-conteo">
                <span class="disponibles-bold">{{ menuHoy.cantidadSopaDisponible ?? 0 }}</span>
                <span class="total-muted">/ {{ menuHoy.cantidadSopaInicial ?? 0 }} disponibles</span>
              </div>
            </div>
            <div class="barra-progreso-fondo">
              <div
                class="barra-progreso-fill"
                :style="{
                  width: `${calcularPorcentaje(menuHoy.cantidadSopaDisponible ?? 0, menuHoy.cantidadSopaInicial ?? 0)}%`,
                  background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                }"
              ></div>
            </div>
          </div>

          <!-- Opciones de Segundo con Colores Distintos -->
          <div
            v-for="(opcion, idx) in (menuHoy.opcionesMenu || [])"
            :key="opcion.id"
            class="item-menu-stock"
          >
            <div class="item-menu-info">
              <div class="item-nombre-badge">
                <span
                  class="tipo-plato-tag"
                  :style="{
                    backgroundColor: getColorPlato(idx).tagBg,
                    color: getColorPlato(idx).tagColor
                  }"
                >
                  Segundo {{ idx + 1 }}
                </span>
                <span class="nombre-plato">{{ opcion.nombreSegundo }}</span>
              </div>
              <div class="stock-conteo">
                <span
                  class="disponibles-bold"
                  :class="{ 'text-danger': (opcion.cantidadDisponible ?? 0) <= 0 }"
                >
                  {{ opcion.cantidadDisponible ?? 0 }}
                </span>
                <span class="total-muted">/ {{ opcion.cantidadInicial ?? 0 }} disponibles</span>
              </div>
            </div>
            <div class="barra-progreso-fondo">
              <div
                class="barra-progreso-fill"
                :style="{
                  width: `${calcularPorcentaje(opcion.cantidadDisponible ?? 0, opcion.cantidadInicial ?? 0)}%`,
                  background: (opcion.cantidadDisponible ?? 0) <= 0
                    ? '#cbd5e1'
                    : getColorPlato(idx).barGrad
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Estado si no hay menú cargado para hoy -->
        <div v-else class="empty-state-menu">
          <div class="empty-icon-box">
            <i class="pi pi-book"></i>
          </div>
          <h3>Aún no se ha registrado el menú para hoy</h3>
          <p>Crea el menú del día para habilitar el control de stock y pedidos automáticos por WhatsApp.</p>
          <Button
            label="Registrar Menú de Hoy"
            icon="pi pi-plus"
            severity="warn"
            style="font-weight: 700; border-radius: 8px;"
            @click="abrirModalPlanificarMenu"
          />
        </div>
      </div>

      <!-- COLUMNA 2: ALERTAS DE COBRO Y RENOVACIÓN -->
      <div class="card-panel">
        <div class="card-panel-header">
          <div class="panel-titulo-box">
            <div class="panel-icon bg-rose-light">
              <i class="pi pi-bell text-rose-dark"></i>
            </div>
            <div>
              <h2 class="panel-titulo">Alertas de Renovación</h2>
              <p class="panel-subtitulo">Saldos agotados o próximos a terminar</p>
            </div>
          </div>
          <Tag
            :value="`${alertas.length} pensionados`"
            :severity="alertas.length > 0 ? 'danger' : 'success'"
            rounded
          />
        </div>

        <div v-if="alertas.length > 0" class="lista-alertas-container">
          <div
            v-for="alerta in alertas"
            :key="alerta.id"
            class="alerta-item-card"
          >
            <div class="alerta-cliente-info">
              <div class="avatar-pensionado">
                {{ alerta.pensionado?.nombreCompleto?.charAt(0)?.toUpperCase() || 'P' }}
              </div>
              <div>
                <div class="nombre-cliente">{{ alerta.pensionado?.nombreCompleto || 'Sin nombre' }}</div>
                <div class="subtext-cliente">
                  {{ alerta.pensionado?.telefono ? 'Tel: ' + alerta.pensionado.telefono : 'Sin teléfono registrado' }}
                </div>
              </div>
            </div>

            <div class="alerta-acciones">
              <Tag
                :value="alerta.completosDisponibles <= 0 ? '0 platos (Agotada)' : `${alerta.completosDisponibles} plato disponible`"
                :severity="alerta.completosDisponibles <= 0 ? 'danger' : 'warn'"
                rounded
              />
              <Button
                label="Cobrar"
                icon="pi pi-credit-card"
                size="small"
                severity="success"
                @click="irACobro(alerta.id)"
              />
            </div>
          </div>
        </div>

        <div v-else class="empty-state-alertas">
          <div class="check-icon-box">
            <i class="pi pi-check-circle"></i>
          </div>
          <h3>¡Todo al día!</h3>
          <p>Todos los clientes con pensión activa cuentan con saldo de almuerzos suficiente.</p>
        </div>
      </div>
    </div>

    <!-- SECCIÓN INFERIOR: ACTIVIDAD RECIENTE (TAB SWITCHER LIMPIO) -->
    <div class="card-panel">
      <div class="card-panel-header">
        <div class="panel-titulo-box">
          <div class="panel-icon bg-indigo-light">
            <i class="pi pi-history text-indigo-dark"></i>
          </div>
          <div>
            <h2 class="panel-titulo">Actividad Reciente</h2>
            <p class="panel-subtitulo">Últimos consumos servidos y cobros registrados</p>
          </div>
        </div>

        <!-- Pestañas Switcher -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            :class="{ activo: tabActividad === 'consumos' }"
            @click="tabActividad = 'consumos'"
          >
            <i class="pi pi-check-circle"></i>
            <span>Consumos ({{ ultimosConsumos.length }})</span>
          </button>
          <button
            class="tab-btn"
            :class="{ activo: tabActividad === 'pagos' }"
            @click="tabActividad = 'pagos'"
          >
            <i class="pi pi-wallet"></i>
            <span>Cobros / Recargas ({{ ultimosPagos.length }})</span>
          </button>
        </div>
      </div>

      <!-- LISTA DE CONSUMOS RECIENTES -->
      <div v-if="tabActividad === 'consumos'" class="actividad-list">
        <div v-if="ultimosConsumos.length > 0" class="items-grid-actividad">
          <div
            v-for="c in ultimosConsumos.slice(0, 8)"
            :key="c.id"
            class="item-actividad-row"
          >
            <div class="actividad-izq">
              <div class="actividad-icon-badge bg-orange-light text-orange-dark">
                <i class="pi pi-shopping-bag"></i>
              </div>
              <div>
                <div class="actividad-nombre">
                  {{ c.pension?.pensionado?.nombreCompleto || 'Pensionado' }}
                </div>
                <div class="actividad-detalle">
                  <span class="plato-tag">{{ c.opcionMenu?.nombreSegundo || 'Almuerzo' }}</span>
                  <span class="fecha-muted">{{ formatFecha(c.fecha) }}</span>
                </div>
              </div>
            </div>

            <div class="actividad-der">
              <Tag
                v-if="c.tipoConsumo === 'WHATSAPP'"
                value="WhatsApp"
                severity="success"
                icon="pi pi-whatsapp"
              />
              <Tag
                v-else
                :value="c.tipoConsumo || 'Manual'"
                severity="secondary"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-muted-text">
          No hay consumos registrados recientemente.
        </div>
      </div>

      <!-- LISTA DE PAGOS RECIENTES -->
      <div v-if="tabActividad === 'pagos'" class="actividad-list">
        <div v-if="ultimosPagos.length > 0" class="items-grid-actividad">
          <div
            v-for="p in ultimosPagos.slice(0, 8)"
            :key="p.id"
            class="item-actividad-row"
          >
            <div class="actividad-izq">
              <div class="actividad-icon-badge bg-emerald-light text-emerald-dark">
                <i class="pi pi-wallet"></i>
              </div>
              <div>
                <div class="actividad-nombre">
                  {{ p.pension?.pensionado?.nombreCompleto || 'Cobro Pensión' }}
                </div>
                <div class="actividad-detalle">
                  <span class="fecha-muted">{{ formatFecha(p.fechaPago) }}</span>
                  <span class="punto-separador">•</span>
                  <span class="metodo-muted">{{ p.metodoPago || 'Efectivo' }}</span>
                </div>
              </div>
            </div>

            <div class="actividad-der">
              <div class="monto-pago-badge">
                + Bs. {{ formatDinero(p.montoTotal) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-muted-text">
          No hay cobros registrados recientemente.
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA VENTA CASUAL EMBEBIDO EN DASHBOARD -->
    <Dialog
      v-model:visible="mostrarModalVenta"
      modal
      header="Registrar Venta Casual de Mostrador"
      :style="{ width: '680px' }"
      :closable="true"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensajeVenta" severity="error" :closable="false">
          {{ errorMensajeVenta }}
        </Message>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Fecha de Venta</label>
            <input
              v-model="fechaVenta"
              type="date"
              disabled
              style="
                width: 100%;
                box-sizing: border-box;
                padding: 0.65rem 0.85rem;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                background-color: #f1f5f9;
                color: #64748b;
                cursor: not-allowed;
                font-family: inherit;
                font-size: 0.9rem;
              "
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #334155; font-size: 0.85rem;">Método de Cobro</label>
            <Select
              v-model="metodoPagoVenta"
              :options="metodosPago"
              fluid
            />
          </div>
        </div>

        <!-- Múltiples Segundos con Cantidad y Tipo -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
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
            <div style="width: 140px;">Tipo</div>
            <div style="width: 90px; text-align: center;">P. Unitario</div>
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
                  :options="todasLasOpcionesMenu"
                  optionLabel="nombreSegundo"
                  optionValue="id"
                  placeholder="Seleccione segundo..."
                  fluid
                >
                  <template #option="slotProps">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <span>{{ slotProps.option.nombreSegundo }}</span>
                      <Tag
                        v-if="slotProps.option.cantidadInicial && slotProps.option.cantidadInicial > 0"
                        :severity="(slotProps.option.cantidadDisponible || 0) <= 0 ? 'danger' : (slotProps.option.cantidadDisponible || 0) <= 5 ? 'warn' : 'success'"
                        :value="(slotProps.option.cantidadDisponible || 0) <= 0 ? 'Agotado' : `${slotProps.option.cantidadDisponible} disp.`"
                        rounded
                        style="font-size: 0.72rem;"
                      />
                    </div>
                  </template>
                </Select>
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
                  <span>Sopa del Día</span>
                </div>
              </div>

              <div style="width: 140px;">
                <Select
                  v-model="item.tipoPlato"
                  :options="tiposPlato"
                  @change="onTipoPlatoChange(item)"
                  fluid
                />
              </div>

              <!-- Precio Unitario Fijo No Editable -->
              <div
                style="
                  width: 90px;
                  text-align: center;
                  padding: 0.55rem 0.4rem;
                  background: #f1f5f9;
                  border: 1px solid #cbd5e1;
                  border-radius: 8px;
                  font-weight: 800;
                  font-size: 0.88rem;
                  color: #1e293b;
                  box-sizing: border-box;
                "
              >
                Bs. {{ formatDinero(item.precioUnitario || 0) }}
              </div>

              <!-- Selector de Cantidad con botones -->
              <div style="width: 125px; display: flex; align-items: center; justify-content: space-between; background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.2rem 0.4rem;">
                <Button
                  icon="pi pi-minus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 24px; height: 24px; padding: 0;"
                  :disabled="item.cantidad <= 1"
                  @click="item.cantidad = Math.max(1, (Number(item.cantidad) || 1) - 1)"
                />
                <input
                  v-model.number="item.cantidad"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  style="width: 45px; text-align: center; font-weight: 800; font-size: 1rem; color: #1e293b; border: none; outline: none; background: transparent;"
                />
                <Button
                  icon="pi pi-plus"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  style="width: 24px; height: 24px; padding: 0;"
                  :disabled="item.cantidad >= 999"
                  @click="item.cantidad = Math.min(999, (Number(item.cantidad) || 0) + 1)"
                />
              </div>

              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
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
                {{ totalPlatosVenta }} plato(s) en total
              </div>
              <div style="font-size: 0.75rem; color: #15803d;">
                Método de cobro: <strong>{{ metodoPagoVenta }}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: #166534; font-weight: 600;">Total a Cobrar:</div>
              <div style="font-size: 1.5rem; font-weight: 900; color: #14532d;">
                Bs. {{ formatDinero(totalMontoCalculado) }}
              </div>
            </div>
          </div>
        </div>

        <Button
          :label="`Registrar Venta (Cobrar Bs. ${formatDinero(totalMontoCalculado)})`"
          icon="pi pi-check"
          severity="success"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 700;"
          :loading="guardandoVenta"
          :disabled="!formularioVentaValido"
          fluid
          @click="guardarVenta"
        />
      </div>
    </Dialog>

    <!-- MODAL PLANIFICAR MENÚ DEL DÍA EMBEBIDO EN DASHBOARD -->
    <Dialog
      v-model:visible="mostrarModalMenu"
      modal
      :header="modoEdicionMenu ? 'Editar Menú del Día' : 'Planificar Menú del Día'"
      :style="{ width: '600px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensajeMenu" severity="error" :closable="false">
          {{ errorMensajeMenu }}
        </Message>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
              Fecha del Menú *
            </label>
            <input
              v-model="fechaMenuForm"
              type="date"
              style="
                width: 100%;
                padding: 0.7rem 0.9rem;
                border: 1px solid #fed7aa;
                border-radius: 8px;
                font-family: inherit;
                box-sizing: border-box;
                font-size: 0.95rem;
                background: #fafaf9;
              "
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
              Sopa del Día *
            </label>
            <InputText
              v-model="sopaMenuForm"
              placeholder="Ej: Sopa de Maní, Caldo..."
              maxlength="150"
              style="padding: 0.7rem 0.9rem;"
            />
          </div>
        </div>

        <!-- Platos / Raciones de Sopa -->
        <div style="background: #fafaf9; border: 1px dashed #fed7aa; padding: 0.85rem; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <div>
            <div style="font-weight: 700; font-size: 0.85rem; color: #44403c;">Total Platos de Sopa (Opcional)</div>
            <div style="font-size: 0.75rem; color: #78716c;">Límite de porciones a despachar</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input
              v-model.number="cantidadSopaInicialForm"
              type="number"
              min="0"
              placeholder="Ilimitado"
              style="
                width: 100px;
                padding: 0.45rem 0.65rem;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                font-family: inherit;
                font-size: 0.85rem;
                text-align: center;
              "
            />
            <span style="font-size: 0.8rem; color: #78716c; font-weight: 600;">platos</span>
          </div>
        </div>

        <!-- Lista de Segundos -->
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          <label style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
            Platos Fuertes / Segundos del Día *
          </label>

          <!-- Input para agregar nueva opción -->
          <div style="display: grid; grid-template-columns: 1fr 110px 42px; gap: 0.5rem;">
            <InputText
              v-model="nuevaOpcionTexto"
              placeholder="Nombre del segundo (Ej: Silpancho)..."
              style="padding: 0.6rem 0.85rem; font-size: 0.9rem;"
              @keyup.enter="agregarOpcionMenu"
            />
            <input
              v-model.number="nuevaOpcionRaciones"
              type="number"
              min="0"
              placeholder="Platos disp."
              style="
                width: 100%;
                padding: 0.6rem 0.5rem;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                font-family: inherit;
                font-size: 0.85rem;
                text-align: center;
                box-sizing: border-box;
              "
              @keyup.enter="agregarOpcionMenu"
            />
            <Button
              icon="pi pi-plus"
              severity="success"
              style="width: 42px; height: 42px; padding: 0;"
              :disabled="!nuevaOpcionTexto.trim()"
              @click="agregarOpcionMenu"
            />
          </div>

          <!-- Opciones agregadas -->
          <div v-if="listaOpcionesMenuForm.length > 0" style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 220px; overflow-y: auto; padding-right: 0.25rem;">
            <div
              v-for="(opcion, index) in listaOpcionesMenuForm"
              :key="index"
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                padding: 0.55rem 0.75rem;
                background: #fdfbf7;
                border: 1px solid #fed7aa;
                border-radius: 8px;
              "
            >
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 700; color: #ea580c; font-size: 0.85rem;">{{ index + 1 }}.</span>
                <span style="font-weight: 600; color: #292524; font-size: 0.9rem;">{{ opcion.nombreSegundo }}</span>
              </div>

              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.3rem;">
                  <input
                    v-model.number="opcion.cantidadInicial"
                    type="number"
                    min="0"
                    placeholder="Disp."
                    style="
                      width: 65px;
                      padding: 0.3rem 0.4rem;
                      border: 1px solid #cbd5e1;
                      border-radius: 6px;
                      font-family: inherit;
                      font-size: 0.85rem;
                      text-align: center;
                    "
                  />
                  <span style="font-size: 0.75rem; color: #78716c;">platos</span>
                </div>

                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  style="width: 28px; height: 28px; padding: 0;"
                  @click="eliminarOpcionMenu(index)"
                />
              </div>
            </div>
          </div>

          <div
            v-else
            style="
              text-align: center;
              padding: 1.5rem;
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              color: #a8a29e;
              font-size: 0.85rem;
            "
          >
            Aún no has agregado segundos para este menú. Escribe uno arriba y presiona el botón (+).
          </div>
        </div>

        <Button
          :label="modoEdicionMenu ? 'Actualizar Menú del Día' : 'Guardar y Publicar Menú'"
          icon="pi pi-check"
          severity="warn"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 700; background: #f97316; border-color: #f97316;"
          :loading="guardandoMenu"
          fluid
          @click="guardarMenu"
        />
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
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.badge-hoy {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #c2410c;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1.5px solid #fdba74;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  margin-bottom: 0.35rem;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.08);
}

.titulo-principal {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.subtitulo {
  margin: 0.2rem 0 0 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.acciones-rapidas {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn-accion-destacado {
  font-weight: 700;
}

/* KPIs Grid */
.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #fed7aa;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07);
}

.kpi-indigo {
  cursor: pointer;
}

.kpi-icon-container {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  flex-shrink: 0;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #64748b;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
  margin-top: 0.1rem;
}

.kpi-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.kpi-subtext {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.punto-separador {
  color: #cbd5e1;
}

/* Colores de Badges e Iconos */
.bg-orange-light { background-color: #fff7ed; }
.text-orange-dark { color: #ea580c; }

.bg-emerald-light { background-color: #ecfdf5; }
.text-emerald-dark { color: #059669; }

.bg-indigo-light { background-color: #eff6ff; }
.text-indigo-dark { color: #2563eb; }

.bg-rose-light { background-color: #fff1f2; }
.text-rose-dark { color: #e11d48; }

.bg-slate-light { background-color: #f1f5f9; }
.text-slate-dark { color: #475569; }

.text-danger { color: #dc2626 !important; }

/* Paneles y Secciones */
.seccion-central-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .seccion-central-grid {
    grid-template-columns: 1fr;
  }
}

.card-panel {
  background: white;
  border-radius: 16px;
  border: 1px solid #fed7aa;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.panel-titulo-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.panel-titulo {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.panel-subtitulo {
  margin: 0.15rem 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

/* Menú de Hoy */
.menu-hoy-container {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.item-menu-stock {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.item-menu-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-nombre-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tipo-plato-tag {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.sopa-tag {
  background-color: #fef3c7;
  color: #b45309;
}

.segundo-tag {
  background-color: #ffedd5;
  color: #c2410c;
}

.nombre-plato {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1e293b;
}

.stock-conteo {
  font-size: 0.85rem;
}

.disponibles-bold {
  font-weight: 800;
  font-size: 1rem;
  color: #0f172a;
}

.total-muted {
  color: #64748b;
  font-size: 0.8rem;
  margin-left: 0.2rem;
}

.barra-progreso-fondo {
  width: 100%;
  height: 7px;
  background-color: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.barra-progreso-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.bg-amber { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }
.bg-orange { background: linear-gradient(90deg, #f97316 0%, #ea580c 100%); }
.bg-rose { background: linear-gradient(90deg, #f43f5e 0%, #e11d48 100%); }

.empty-state-menu {
  text-align: center;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background-color: #fff7ed;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.empty-state-menu h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.empty-state-menu p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  max-width: 320px;
}

/* Alertas de Renovación */
.lista-alertas-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 290px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.alerta-item-card {
  background: #f8fafc;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.alerta-cliente-info {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar-pensionado {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffedd5;
  color: #c2410c;
  font-weight: 800;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nombre-cliente {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e293b;
}

.subtext-cliente {
  font-size: 0.75rem;
  color: #64748b;
}

.alerta-acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-state-alertas {
  text-align: center;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.check-icon-box {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.empty-state-alertas h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.empty-state-alertas p {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  max-width: 320px;
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.25rem;
  gap: 0.25rem;
}

.tab-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.tab-btn.activo {
  background: white;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  font-weight: 700;
}

/* Actividad Grid */
.items-grid-actividad {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 0.75rem;
}

.item-actividad-row {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.actividad-izq {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.actividad-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.actividad-nombre {
  font-weight: 700;
  font-size: 0.88rem;
  color: #1e293b;
}

.actividad-detalle {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.15rem;
}

.plato-tag {
  color: #ea580c;
  font-weight: 600;
}

.fecha-muted {
  color: #94a3b8;
}

.metodo-muted {
  color: #64748b;
  font-weight: 500;
}

.monto-pago-badge {
  font-weight: 800;
  font-size: 0.95rem;
  color: #059669;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
}

.empty-muted-text {
  text-align: center;
  color: #94a3b8;
  font-size: 0.85rem;
  padding: 1.5rem;
}
</style>
