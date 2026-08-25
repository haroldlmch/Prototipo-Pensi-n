<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

import api from '../api/axios';

interface OpcionMenu {
  id?: number;
  nombreSegundo: string;
}

interface Menu {
  id: number;
  fecha: string;
  sopa: string;
  opcionesMenu?: OpcionMenu[];
}

const menus = ref<Menu[]>([]);
const busquedaFecha = ref<Date | null>(null);
const busquedaTexto = ref('');
const cargando = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const menusFiltrados = computed(() => {
  let resultado = menus.value;

  if (busquedaFecha.value) {
    const d = new Date(busquedaFecha.value);
    const fechaSeleccionada = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    resultado = resultado.filter((menu) => {
      const fechaMenu = (menu.fecha || '').slice(0, 10);
      return fechaMenu === fechaSeleccionada;
    });
  }

  if (busquedaTexto.value.trim()) {
    const q = busquedaTexto.value.toLowerCase().trim();
    resultado = resultado.filter((m) => {
      const matchSopa = m.sopa?.toLowerCase().includes(q);
      const matchOpcion = m.opcionesMenu?.some((op) =>
        op.nombreSegundo?.toLowerCase().includes(q),
      );
      return matchSopa || matchOpcion;
    });
  }

  return resultado;
});

const visible = ref(false);
const modoEdicion = ref(false);
const menuId = ref<number | null>(null);

const fecha = ref('');
const sopa = ref('');
const listaOpciones = ref<string[]>([]);
const nuevaOpcionTexto = ref('');

const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const eliminando = ref(false);

const cargarMenus = async () => {
  cargando.value = true;
  try {
    const response = await api.get('/menus');
    menus.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    cargando.value = false;
  }
};

const limpiarFormulario = () => {
  menuId.value = null;
  fecha.value = obtenerFechaLocal();
  sopa.value = '';
  listaOpciones.value = [];
  nuevaOpcionTexto.value = '';
  errorMensaje.value = '';
  modoEdicion.value = false;
};

const nuevoMenu = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarMenu = (menu: Menu) => {
  menuId.value = menu.id;
  fecha.value = menu.fecha ? menu.fecha.slice(0, 10) : '';
  sopa.value = menu.sopa;
  listaOpciones.value = (menu.opcionesMenu || []).map((op) => op.nombreSegundo);
  nuevaOpcionTexto.value = '';
  errorMensaje.value = '';
  modoEdicion.value = true;
  visible.value = true;
};

const agregarOpcion = () => {
  const texto = nuevaOpcionTexto.value.trim();
  if (!texto) return;
  if (listaOpciones.value.includes(texto)) {
    errorMensaje.value = 'Esta opción ya fue agregada al menú';
    return;
  }
  errorMensaje.value = '';
  listaOpciones.value.push(texto);
  nuevaOpcionTexto.value = '';
};

const removerOpcion = (index: number) => {
  listaOpciones.value.splice(index, 1);
};

const guardarMenu = async () => {
  errorMensaje.value = '';

  if (!fecha.value) {
    errorMensaje.value = 'Debe seleccionar una fecha para el menú';
    return;
  }

  if (!sopa.value.trim()) {
    errorMensaje.value = 'Debe indicar la sopa del día';
    return;
  }

  if (listaOpciones.value.length === 0) {
    errorMensaje.value = 'Debe agregar al menos una opción de plato fuerte (segundo)';
    return;
  }

  guardando.value = true;
  try {
    const payload = {
      fecha: fecha.value.slice(0, 10),
      sopa: sopa.value.trim(),
      opciones: listaOpciones.value,
    };

    if (modoEdicion.value && menuId.value) {
      await api.patch(`/menus/${menuId.value}`, payload);
    } else {
      await api.post('/menus', payload);
    }

    visible.value = false;
    await cargarMenus();
  } catch (error: any) {
    console.error(error);
    errorMensaje.value =
      error.response?.data?.message || 'Error al guardar el menú del día';
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mostrarConfirmarEliminar.value = true;
};

const eliminarMenuConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/menus/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarMenus();
  } catch (error) {
    console.error(error);
  } finally {
    eliminando.value = false;
  }
};

const formatFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const dateOnly = fechaStr.slice(0, 10);
  const [y, m, d] = dateOnly.split('-');
  if (!y || !m || !d) return fechaStr;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

onMounted(() => {
  cargarMenus();
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
          Menús del Día
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Planificación unificada de la sopa y los platos fuertes (segundos) por fecha.
        </p>
      </div>

      <Button
        label="Nuevo Menú del Día"
        icon="pi pi-plus"
        severity="success"
        raised
        @click="nuevoMenu"
      />
    </div>

    <!-- Buscadores -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      "
    >
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 250px;">
        <i class="pi pi-search" style="color: #94a3b8;"></i>
        <InputText
          v-model="busquedaTexto"
          placeholder="Buscar por sopa o plato fuerte..."
          style="width: 100%;"
        />
      </div>

      <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 220px;">
        <i class="pi pi-calendar" style="color: #94a3b8;"></i>
        <Calendar
          v-model="busquedaFecha"
          dateFormat="dd/mm/yy"
          placeholder="Filtrar por fecha..."
          showIcon
          style="width: 100%;"
        />
        <Button
          v-if="busquedaFecha || busquedaTexto"
          icon="pi pi-times"
          severity="secondary"
          text
          rounded
          title="Limpiar filtros"
          @click="busquedaFecha = null; busquedaTexto = '';"
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
        :value="menusFiltrados"
        :loading="cargando"
        stripedRows
        paginator
        :rows="8"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <template #empty>
          <div style="text-align: center; padding: 2rem; color: #94a3b8;">
            <i class="pi pi-info-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
            <p style="margin: 0;">No se encontraron menús registrados</p>
          </div>
        </template>

        <Column
          header="Fecha"
          style="font-weight: 600; color: #1e293b; width: 230px;"
        >
          <template #body="slotProps">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="pi pi-calendar-clock" style="color: #3b82f6;"></i>
              <span style="text-transform: capitalize;">
                {{ formatFecha(slotProps.data.fecha) }}
              </span>
            </div>
          </template>
        </Column>

        <Column
          header="Sopa del Día"
          style="font-weight: 500; color: #334155; width: 220px;"
        >
          <template #body="slotProps">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 1.1rem;">🍲</span>
              <strong>{{ slotProps.data.sopa }}</strong>
            </div>
          </template>
        </Column>

        <Column
          header="Platos Fuertes / Segundos Disponibles"
          style="color: #475569;"
        >
          <template #body="slotProps">
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <Tag
                v-for="opcion in slotProps.data.opcionesMenu || []"
                :key="opcion.id || opcion.nombreSegundo"
                :value="opcion.nombreSegundo"
                severity="info"
                rounded
                style="font-weight: 500; font-size: 0.85rem; padding: 0.35rem 0.75rem;"
              />
              <span
                v-if="!slotProps.data.opcionesMenu || slotProps.data.opcionesMenu.length === 0"
                style="color: #94a3b8; font-size: 0.85rem; font-style: italic;"
              >
                Sin platos configurados
              </span>
            </div>
          </template>
        </Column>

        <Column header="Acciones" style="width: 120px; text-align: center;">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              title="Editar Menú y Opciones"
              style="margin-right: .25rem"
              @click="editarMenu(slotProps.data)"
            />

            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              title="Eliminar Menú"
              @click="confirmarEliminar(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogo Maestro-Detalle de Formulario -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Menú del Día' : 'Nuevo Menú del Día'"
      :style="{ width: '560px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensaje" severity="error" :closable="false">
          {{ errorMensaje }}
        </Message>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">
              Fecha del Menú *
            </label>
            <input
              v-model="fecha"
              type="date"
              style="
                width: 100%;
                padding: 0.7rem 0.9rem;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-family: inherit;
                box-sizing: border-box;
                font-size: 0.95rem;
              "
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">
              Sopa del Día *
            </label>
            <InputText
              v-model="sopa"
              placeholder="Ej: Sopa de Maní, Caldo..."
              style="padding: 0.7rem 0.9rem;"
            />
          </div>
        </div>

        <!-- Sección de Opciones de Platos Fuertes (Detalle) -->
        <div
          style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          "
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">
              🍽️ Platos Fuertes / Segundos del Menú
            </span>
            <span style="font-size: 0.8rem; color: #64748b;">
              {{ listaOpciones.length }} plato(s)
            </span>
          </div>

          <!-- Input para agregar nuevo plato -->
          <div style="display: flex; gap: 0.5rem;">
            <InputText
              v-model="nuevaOpcionTexto"
              placeholder="Nombre del segundo (ej: Milanesa con puré)..."
              style="flex: 1; padding: 0.6rem 0.85rem;"
              @keyup.enter="agregarOpcion"
            />
            <Button
              label="Agregar"
              icon="pi pi-plus"
              severity="info"
              @click="agregarOpcion"
            />
          </div>

          <!-- Lista de platos agregados -->
          <div
            v-if="listaOpciones.length > 0"
            style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.25rem;"
          >
            <div
              v-for="(op, idx) in listaOpciones"
              :key="idx"
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 0.5rem 0.75rem;
              "
            >
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span
                  style="
                    background: #e0e7ff;
                    color: #4338ca;
                    font-weight: 700;
                    border-radius: 50%;
                    width: 22px;
                    height: 22px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                  "
                >
                  {{ idx + 1 }}
                </span>
                <span style="font-weight: 500; color: #334155;">{{ op }}</span>
              </div>

              <Button
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                size="small"
                title="Quitar opción"
                @click="removerOpcion(idx)"
              />
            </div>
          </div>
          <div
            v-else
            style="text-align: center; padding: 0.75rem; color: #94a3b8; font-size: 0.85rem; font-style: italic;"
          >
            No has agregado platos fuertes para este día aún.
          </div>
        </div>

        <Button
          label="Guardar Menú Completo"
          icon="pi pi-save"
          severity="success"
          :loading="guardando"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 600;"
          fluid
          @click="guardarMenu"
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
            ¿Eliminar este Menú?
          </h3>
          <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
            Se eliminará la programación del día y sus platos asignados. Esta acción no se puede deshacer.
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
            @click="eliminarMenuConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>