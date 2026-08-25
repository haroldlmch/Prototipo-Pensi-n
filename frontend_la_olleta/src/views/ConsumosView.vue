<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
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
  id: number;
  nombreCompleto: string;
}

interface Pension {
  id: number;
  completosDisponibles: number;
  cantidadCompletos: number;
  estado: string;
  pensionado?: Pensionado;
}

interface OpcionMenu {
  id: number;
  nombreSegundo: string;
}

interface MenuHoy {
  id: number;
  fecha: string;
  sopa: string;
  opcionesMenu: OpcionMenu[];
}

interface Consumo {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  tipoConsumo: string;
  pension?: Pension;
  opcionMenu?: OpcionMenu;
}

const consumos = ref<Consumo[]>([]);
const pensiones = ref<Pension[]>([]);
const menuHoy = ref<MenuHoy | null>(null);
const todasLasOpciones = ref<OpcionMenu[]>([]);

const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');
const exitoMensaje = ref('');

// Marcación rápida
const busquedaRapida = ref('');
const pensionRapidaSeleccionada = ref<Pension | null>(null);
const opcionRapidaSeleccionada = ref<OpcionMenu | null>(null);
const tipoConsumoRapido = ref('Almuerzo en Comedor');
const marcandoRapido = ref(false);

// Modal Edición / Registro Clásico
const visibleModal = ref(false);
const modoEdicion = ref(false);
const consumoId = ref<number | null>(null);
const fechaForm = ref('');
const cantidadCompletosForm = ref<number | null>(1);
const tipoConsumoForm = ref('Almuerzo en Comedor');
const idPensionForm = ref<number | null>(null);
const idOpcionMenuForm = ref<number | null>(null);

// Filtros de tabla
const busquedaTabla = ref('');
const busquedaFecha = ref<Date | null>(null);

const tiposConsumo = [
  'Almuerzo en Comedor',
  'Para llevar / Vianda',
  'Entrega / Delivery',
];

const pensionesActivas = computed(() => {
  return pensiones.value.filter(
    (p) => p.estado === 'ACTIVA' && p.completosDisponibles > 0,
  );
});

const pensionesFiltradasRapidas = computed(() => {
  const q = busquedaRapida.value.toLowerCase().trim();
  if (!q) return pensionesActivas.value.slice(0, 8);
  return pensionesActivas.value.filter((p) =>
    (p.pensionado?.nombreCompleto || '').toLowerCase().includes(q),
  );
});

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const consumosFiltrados = computed(() => {
  let res = consumos.value;

  if (busquedaTabla.value.trim()) {
    const q = busquedaTabla.value.toLowerCase().trim();
    res = res.filter((c) => {
      const nombre = (c.pension?.pensionado?.nombreCompleto || '').toLowerCase();
      const plato = (c.opcionMenu?.nombreSegundo || '').toLowerCase();
      return nombre.includes(q) || plato.includes(q);
    });
  }

  if (busquedaFecha.value) {
    const d = new Date(busquedaFecha.value);
    const fStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    res = res.filter((c) => {
      const fc = (c.fecha || '').slice(0, 10);
      return fc === fStr;
    });
  }

  return res;
});

// Modal Confirmar Eliminar
const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const eliminando = ref(false);

const cargarDatos = async () => {
  cargando.value = true;
  try {
    const [resConsumos, resPensiones, resMenus] = await Promise.all([
      api.get('/consumos'),
      api.get('/pensiones'),
      api.get('/menus'),
    ]);

    consumos.value = resConsumos.data;
    pensiones.value = resPensiones.data;

    // Obtener menú de hoy
    const hoyStr = obtenerFechaLocal();
    const mHoy = resMenus.data.find((m: any) => {
      const f = (m.fecha || '').slice(0, 10);
      return f === hoyStr;
    });

    if (mHoy) {
      menuHoy.value = mHoy;
      todasLasOpciones.value = mHoy.opcionesMenu || [];
      if (mHoy.opcionesMenu && mHoy.opcionesMenu.length > 0) {
        opcionRapidaSeleccionada.value = mHoy.opcionesMenu[0] ?? null;
      }
    } else if (resMenus.data.length > 0) {
      // Si no hay menú de hoy, tomar el más reciente
      menuHoy.value = resMenus.data[0];
      todasLasOpciones.value = resMenus.data[0].opcionesMenu || [];
      if (todasLasOpciones.value.length > 0) {
        opcionRapidaSeleccionada.value = todasLasOpciones.value[0] ?? null;
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    cargando.value = false;
  }
};

const seleccionarPensionRapida = (p: Pension) => {
  pensionRapidaSeleccionada.value = p;
  errorMensaje.value = '';
  exitoMensaje.value = '';
};

const registrarConsumoRapido = async () => {
  if (!pensionRapidaSeleccionada.value) {
    errorMensaje.value = 'Seleccione un pensionado de la lista';
    return;
  }

  if (!opcionRapidaSeleccionada.value) {
    errorMensaje.value = 'Seleccione el plato fuerte / opción del menú';
    return;
  }

  marcandoRapido.value = true;
  errorMensaje.value = '';
  exitoMensaje.value = '';

  try {
    const hoy = obtenerFechaLocal();
    const payload = {
      idPension: pensionRapidaSeleccionada.value.id,
      idOpcionMenu: opcionRapidaSeleccionada.value.id,
      fecha: hoy,
      cantidadCompletos: 1,
      tipoConsumo: tipoConsumoRapido.value,
    };

    await api.post('/consumos', payload);

    const pensionadoNombre =
      pensionRapidaSeleccionada.value.pensionado?.nombreCompleto || 'Pensionado';
    const quedan = pensionRapidaSeleccionada.value.completosDisponibles - 1;

    exitoMensaje.value = `¡Consumo registrado exitosamente para ${pensionadoNombre}! (Saldo restante: ${quedan} platos)`;

    pensionRapidaSeleccionada.value = null;
    busquedaRapida.value = '';

    await cargarDatos();
  } catch (error: any) {
    errorMensaje.value =
      error.response?.data?.message || 'Error al registrar consumo rápido';
  } finally {
    marcandoRapido.value = false;
  }
};

const nuevoConsumoClasico = () => {
  modoEdicion.value = false;
  consumoId.value = null;
  fechaForm.value = obtenerFechaLocal();
  cantidadCompletosForm.value = 1;
  tipoConsumoForm.value = 'Almuerzo en Comedor';
  idPensionForm.value = null;
  idOpcionMenuForm.value =
    todasLasOpciones.value.length > 0 ? (todasLasOpciones.value[0]?.id ?? null) : null;
  errorMensaje.value = '';
  visibleModal.value = true;
};

const editarConsumo = (c: Consumo) => {
  modoEdicion.value = true;
  consumoId.value = c.id;
  fechaForm.value = c.fecha ? c.fecha.slice(0, 10) : '';
  cantidadCompletosForm.value = c.cantidadCompletos;
  tipoConsumoForm.value = c.tipoConsumo || 'Almuerzo en Comedor';
  idPensionForm.value = c.pension?.id || null;
  idOpcionMenuForm.value = c.opcionMenu?.id || null;
  errorMensaje.value = '';
  visibleModal.value = true;
};

const guardarConsumoFormulario = async () => {
  if (!idPensionForm.value || !idOpcionMenuForm.value || !fechaForm.value) {
    errorMensaje.value = 'Complete todos los campos obligatorios';
    return;
  }

  guardando.value = true;
  try {
    const payload = {
      idPension: idPensionForm.value,
      idOpcionMenu: idOpcionMenuForm.value,
      fecha: fechaForm.value.slice(0, 10),
      cantidadCompletos: Number(cantidadCompletosForm.value) || 1,
      tipoConsumo: tipoConsumoForm.value,
    };

    if (modoEdicion.value && consumoId.value) {
      await api.patch(`/consumos/${consumoId.value}`, payload);
    } else {
      await api.post('/consumos', payload);
    }

    visibleModal.value = false;
    await cargarDatos();
  } catch (error: any) {
    errorMensaje.value =
      error.response?.data?.message || 'Error al guardar consumo';
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mostrarConfirmarEliminar.value = true;
};

const eliminarConsumoConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/consumos/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarDatos();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
  }
};

const formatFecha = (fStr: string) => {
  if (!fStr) return '';
  const dateOnly = fStr.slice(0, 10);
  const [y, m, d] = dateOnly.split('-');
  if (!y || !m || !d) return fStr;
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return dateObj.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

onMounted(() => {
  cargarDatos();
});
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
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
          Control de Consumos en Comedor
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Marcación rápida de almuerzos diarios y control de saldo de platos.
        </p>
      </div>

      <Button
        label="Registro Manual / Personalizado"
        icon="pi pi-plus"
        severity="secondary"
        outlined
        @click="nuevoConsumoClasico"
      />
    </div>

    <!-- Banner Menú del Día -->
    <div
      style="
        background: linear-gradient(135deg, #1c1917 0%, #292524 100%);
        border-radius: 16px;
        border: 1px solid #44403c;
        padding: 1.25rem 1.5rem;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.25);
      "
    >
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div
          style="
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);
            flex-shrink: 0;
          "
        >
          <i class="pi pi-clipboard" style="font-size: 1.35rem; color: white;"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #a8a29e; font-weight: 700;">
            Menú del Día ({{ menuHoy ? formatFecha(menuHoy.fecha) : 'Hoy' }})
          </div>
          <div style="font-size: 1.15rem; font-weight: 700; color: #fafaf9; margin-top: 0.15rem;">
            Sopa: <span style="color: #f97316; font-weight: 800;">{{ menuHoy ? menuHoy.sopa : 'Sin menú configurado' }}</span>
          </div>
        </div>
      </div>

      <!-- Platos disponibles -->
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <span style="font-size: 0.85rem; color: #d6d3d1; font-weight: 600;">Platos Fuertes:</span>
        <Tag
          v-for="op in (menuHoy?.opcionesMenu || [])"
          :key="op.id"
          :value="op.nombreSegundo"
          style="padding: 0.4rem 0.85rem; font-size: 0.85rem; background: #ea580c; color: white; border-radius: 8px; font-weight: 700; border: none; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);"
        />
        <span v-if="!menuHoy?.opcionesMenu || menuHoy.opcionesMenu.length === 0" style="color: #a8a29e; font-size: 0.85rem;">
          Configure el menú en la sección "Menú del Día"
        </span>
      </div>
    </div>

    <!-- Panel de Marcación Rápida de Comedor -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 12px -2px rgba(234, 88, 12, 0.06);
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      "
    >
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <i class="pi pi-bolt" style="color: #ea580c; font-size: 1.25rem;"></i>
          <h2 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1c1917;">
            Marcación Rápida de Comedor (1-Clic)
          </h2>
        </div>
        <span style="font-size: 0.85rem; color: #78716c; font-weight: 600;">
          {{ pensionesActivas.length }} pensionados con saldo activo
        </span>
      </div>

      <Message v-if="exitoMensaje" severity="success" :closable="false">
        {{ exitoMensaje }}
      </Message>
      <Message v-if="errorMensaje" severity="error" :closable="false">
        {{ errorMensaje }}
      </Message>

      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem;">
        <!-- Columna 1: Buscar y Seleccionar Pensionado -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <label style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
            1. Seleccionar Pensionado Activo:
          </label>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-search" style="color: #a8a29e;"></i>
            <InputText
              v-model="busquedaRapida"
              placeholder="Buscar pensionado por nombre..."
              style="width: 100%; padding: 0.6rem 0.85rem;"
            />
          </div>

          <!-- Mini Lista de Selección Rápida -->
          <div
            style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
              max-height: 180px;
              overflow-y: auto;
              padding: 0.25rem;
            "
          >
            <div
              v-for="p in pensionesFiltradasRapidas"
              :key="p.id"
              style="
                padding: 0.65rem 0.85rem;
                border-radius: 10px;
                cursor: pointer;
                border: 1.5px solid;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
                transition: all 0.15s ease;
              "
              :style="
                pensionRapidaSeleccionada?.id === p.id
                  ? 'border-color: #ea580c; background: #fff7ed;'
                  : 'border-color: #e7e5e4; background: #fafaf9;'
              "
              @click="seleccionarPensionRapida(p)"
            >
              <div style="font-weight: 700; color: #1c1917; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ p.pensionado?.nombreCompleto }}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: #78716c;">Pensión #{{ p.id }}</span>
                <Tag
                  :value="`${p.completosDisponibles} disp.`"
                  :severity="p.completosDisponibles <= 5 ? 'warn' : 'success'"
                  rounded
                  style="font-size: 0.75rem; padding: 0.15rem 0.5rem;"
                />
              </div>
            </div>
            <div
              v-if="pensionesFiltradasRapidas.length === 0"
              style="grid-column: span 2; text-align: center; color: #a8a29e; font-size: 0.85rem; padding: 1rem;"
            >
              No se encontraron pensionados activos con saldo.
            </div>
          </div>
        </div>

        <!-- Columna 2: Elegir Plato y Confirmar -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem; justify-content: space-between;">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <label style="font-weight: 700; color: #44403c; font-size: 0.85rem;">
              2. Plato Fuerte / Segundo a Servir:
            </label>
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              <div
                v-for="op in (menuHoy?.opcionesMenu || todasLasOpciones)"
                :key="op.id"
                style="
                  padding: 0.65rem 0.85rem;
                  border-radius: 10px;
                  border: 1.5px solid;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  transition: all 0.15s ease;
                "
                :style="
                  opcionRapidaSeleccionada?.id === op.id
                    ? 'border-color: #ea580c; background: #fff7ed; font-weight: 700;'
                    : 'border-color: #e7e5e4; background: white;'
                "
                @click="opcionRapidaSeleccionada = op"
              >
                <i
                  :class="opcionRapidaSeleccionada?.id === op.id ? 'pi pi-check-circle' : 'pi pi-circle'"
                  :style="opcionRapidaSeleccionada?.id === op.id ? 'color: #ea580c;' : 'color: #a8a29e;'"
                ></i>
                <span style="color: #292524; font-size: 0.9rem;">{{ op.nombreSegundo }}</span>
              </div>
            </div>

            <!-- Tipo de consumo -->
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
              <span style="font-size: 0.8rem; font-weight: 700; color: #78716c;">Modalidad:</span>
              <Select
                v-model="tipoConsumoRapido"
                :options="tiposConsumo"
                style="flex: 1; font-size: 0.85rem;"
              />
            </div>
          </div>

          <!-- Botón de Acción Directa -->
          <Button
            :label="
              pensionRapidaSeleccionada
                ? `Descontar Almuerzo para ${pensionRapidaSeleccionada.pensionado?.nombreCompleto}`
                : 'Seleccione un pensionado arriba'
            "
            icon="pi pi-check-circle"
            severity="warn"
            raised
            :disabled="!pensionRapidaSeleccionada || !opcionRapidaSeleccionada"
            :loading="marcandoRapido"
            style="
              padding: 0.85rem;
              font-weight: 700;
              font-size: 0.95rem;
              background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
              border: none !important;
              color: white !important;
              box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35) !important;
            "
            @click="registrarConsumoRapido"
          />
        </div>
      </div>
    </div>

    <!-- Historial de Consumos -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #fed7aa;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      "
    >
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">
          Historial de Consumos Registrados
        </h2>

        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-search" style="color: #94a3b8;"></i>
            <InputText
              v-model="busquedaTabla"
              placeholder="Buscar por cliente o plato..."
              style="padding: 0.5rem 0.75rem; font-size: 0.85rem;"
            />
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="pi pi-calendar" style="color: #94a3b8;"></i>
            <Calendar
              v-model="busquedaFecha"
              dateFormat="dd/mm/yy"
              placeholder="Filtrar por fecha..."
              showIcon
              style="font-size: 0.85rem;"
            />
            <Button
              v-if="busquedaFecha || busquedaTabla"
              icon="pi pi-times"
              severity="secondary"
              text
              rounded
              title="Limpiar filtros"
              @click="busquedaFecha = null; busquedaTabla = '';"
            />
          </div>
        </div>
      </div>

      <DataTable
        :value="consumosFiltrados"
        :loading="cargando"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <template #empty>
          <div style="text-align: center; padding: 2rem; color: #94a3b8;">
            No se encontraron consumos registrados.
          </div>
        </template>

        <Column header="Fecha" style="width: 140px; font-weight: 600; color: #1e293b;">
          <template #body="slotProps">
            {{ formatFecha(slotProps.data.fecha) }}
          </template>
        </Column>

        <Column header="Pensionado" style="font-weight: 600; color: #334155;">
          <template #body="slotProps">
            {{ slotProps.data.pension?.pensionado?.nombreCompleto ?? 'Sin nombre' }}
          </template>
        </Column>

        <Column header="Plato Consumido" style="color: #475569;">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.opcionMenu?.nombreSegundo ?? 'No especificado'"
              severity="info"
              rounded
            />
          </template>
        </Column>

        <Column field="cantidadCompletos" header="Cantidad" style="width: 100px; text-align: center;">
          <template #body="slotProps">
            <span style="font-weight: 700; color: #1e293b;">
              {{ slotProps.data.cantidadCompletos }} plato(s)
            </span>
          </template>
        </Column>

        <Column field="tipoConsumo" header="Modalidad" style="width: 180px; color: #64748b;" />

        <Column header="Acciones" style="width: 110px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              title="Editar Consumo"
              @click="editarConsumo(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              title="Eliminar Consumo (Devuelve saldo)"
              @click="confirmarEliminar(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo Registro Clásico / Edición -->
    <Dialog
      v-model:visible="visibleModal"
      modal
      :header="modoEdicion ? 'Editar Consumo' : 'Nuevo Consumo Manual'"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensaje" severity="error" :closable="false">
          {{ errorMensaje }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Pensión / Pensionado *</label>
          <Select
            v-model="idPensionForm"
            :options="pensiones"
            optionValue="id"
            :optionLabel="(p: any) => `${p.pensionado?.nombreCompleto || 'Sin nombre'} - Pensión #${p.id} (${p.completosDisponibles} disp.)`"
            placeholder="Seleccione la pensión..."
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Plato Fuerte / Segundo *</label>
          <Select
            v-model="idOpcionMenuForm"
            :options="todasLasOpciones"
            optionLabel="nombreSegundo"
            optionValue="id"
            placeholder="Seleccione el plato..."
            fluid
          />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Fecha *</label>
            <input
              v-model="fechaForm"
              type="date"
              style="
                width: 100%;
                padding: 0.7rem 0.9rem;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-family: inherit;
                box-sizing: border-box;
              "
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Cantidad de Platos *</label>
            <InputNumber
              v-model="cantidadCompletosForm"
              :min="1"
              :max="10"
              showButtons
              fluid
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Modalidad de Consumo</label>
          <Select
            v-model="tipoConsumoForm"
            :options="tiposConsumo"
            fluid
          />
        </div>

        <Button
          label="Guardar Consumo"
          icon="pi pi-save"
          severity="success"
          :loading="guardando"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 600;"
          fluid
          @click="guardarConsumoFormulario"
        />
      </div>
    </Dialog>

    <!-- Dialogo Confirmar Eliminación -->
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
            ¿Eliminar este consumo?
          </h3>
          <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
            El plato consumido será reintegrado automáticamente a la pensión activa del cliente.
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
            label="Eliminar y Reintegrar"
            severity="danger"
            style="flex: 1; padding: 0.75rem;"
            :loading="eliminando"
            @click="eliminarConsumoConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
