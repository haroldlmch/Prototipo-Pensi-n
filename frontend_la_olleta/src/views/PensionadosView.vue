<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';

import api from '../api/axios';

interface Pago {
  id: number;
  fechaPago: string;
  montoTotal: number | string;
  precioUnitario: number | string;
}

interface Consumo {
  id: number;
  fecha: string;
  cantidadCompletos: number;
  tipoConsumo: string;
  opcionMenu?: {
    nombreSegundo: string;
  };
}

interface Extra {
  id: number;
  fecha: string;
  descripcion: string;
  precio: number | string;
  estadoPago?: string;
}

interface Pension {
  id: number;
  fechaInicio: string;
  cantidadCompletos: number;
  completosDisponibles: number;
  estado: string;
  pagos?: Pago[];
  consumos?: Consumo[];
  extras?: Extra[];
}

interface Pensionado {
  id: number;
  nombreCompleto: string;
  telefono: string;
  estado: boolean;
  pensiones?: Pension[];
}

const pensionados = ref<Pensionado[]>([]);
const busqueda = ref('');
const cargando = ref(false);

const pensionadosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return pensionados.value;
  return pensionados.value.filter((p) =>
    p.nombreCompleto.toLowerCase().includes(busqueda.value.toLowerCase()),
  );
});

// Modal Crear/Editar
const visible = ref(false);
const modoEdicion = ref(false);
const pensionadoId = ref<number | null>(null);
const nombreCompleto = ref('');
const telefono = ref('');
const estado = ref(true);
const guardando = ref(false);
const errorMensaje = ref('');

// Modal Confirmar Eliminar
const mostrarConfirmarEliminar = ref(false);
const idAEliminar = ref<number | null>(null);
const eliminando = ref(false);

// Modal Perfil 360° / Ficha de Cuenta
const visibleFicha = ref(false);
const cargandoFicha = ref(false);
const pensionadoFicha = ref<Pensionado | null>(null);
const tabActivo = ref<'consumos' | 'pagos' | 'extras' | 'pensiones'>('consumos');

const cargarPensionados = async () => {
  cargando.value = true;
  try {
    const response = await api.get('/pensionados');
    pensionados.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    cargando.value = false;
  }
};

const verFicha360 = async (p: Pensionado) => {
  visibleFicha.value = true;
  cargandoFicha.value = true;
  pensionadoFicha.value = null;
  tabActivo.value = 'consumos';
  try {
    const response = await api.get(`/pensionados/${p.id}`);
    pensionadoFicha.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    cargandoFicha.value = false;
  }
};

const pensioneActivaFicha = computed<Pension | null>(() => {
  if (!pensionadoFicha.value?.pensiones) return null;
  return (
    pensionadoFicha.value.pensiones.find((p) => p.estado === 'ACTIVA') ||
    pensionadoFicha.value.pensiones[0] ||
    null
  );
});

const porcentajeConsumoActiva = computed(() => {
  const p = pensioneActivaFicha.value;
  if (!p || p.cantidadCompletos <= 0) return 0;
  const consumidos = p.cantidadCompletos - p.completosDisponibles;
  return Math.round((consumidos / p.cantidadCompletos) * 100);
});

const todosLosConsumosFicha = computed<Consumo[]>(() => {
  if (!pensionadoFicha.value?.pensiones) return [];
  const lista: Consumo[] = [];
  pensionadoFicha.value.pensiones.forEach((p) => {
    (p.consumos || []).forEach((c) => lista.push(c));
  });
  return lista.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
});

const todosLosPagosFicha = computed<Pago[]>(() => {
  if (!pensionadoFicha.value?.pensiones) return [];
  const lista: Pago[] = [];
  pensionadoFicha.value.pensiones.forEach((p) => {
    (p.pagos || []).forEach((pago) => lista.push(pago));
  });
  return lista.sort(
    (a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime(),
  );
});

const todosLosExtrasFicha = computed<Extra[]>(() => {
  if (!pensionadoFicha.value?.pensiones) return [];
  const lista: Extra[] = [];
  pensionadoFicha.value.pensiones.forEach((p) => {
    (p.extras || []).forEach((e) => lista.push(e));
  });
  return lista.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );
});

const totalMontoPagadoFicha = computed(() => {
  return todosLosPagosFicha.value.reduce(
    (acc, p) => acc + Number(p.montoTotal || 0),
    0,
  );
});

const totalMontoExtrasFicha = computed(() => {
  return todosLosExtrasFicha.value.reduce(
    (acc, e) => acc + Number(e.precio || 0),
    0,
  );
});

const limpiarFormulario = () => {
  pensionadoId.value = null;
  nombreCompleto.value = '';
  telefono.value = '';
  estado.value = true;
  errorMensaje.value = '';
  modoEdicion.value = false;
};

const nuevoPensionado = () => {
  limpiarFormulario();
  visible.value = true;
};

const editarPensionado = (pensionado: Pensionado) => {
  pensionadoId.value = pensionado.id;
  nombreCompleto.value = pensionado.nombreCompleto;
  telefono.value = pensionado.telefono ?? '';
  estado.value = pensionado.estado;
  errorMensaje.value = '';
  modoEdicion.value = true;
  visible.value = true;
};

const guardarPensionado = async () => {
  if (!nombreCompleto.value.trim()) {
    errorMensaje.value = 'El nombre completo es obligatorio';
    return;
  }

  guardando.value = true;
  try {
    const payload = {
      nombreCompleto: nombreCompleto.value.trim(),
      telefono: telefono.value.trim() || undefined,
      estado: estado.value,
    };

    if (modoEdicion.value && pensionadoId.value) {
      await api.patch(`/pensionados/${pensionadoId.value}`, payload);
    } else {
      await api.post('/pensionados', payload);
    }

    visible.value = false;
    limpiarFormulario();
    await cargarPensionados();
  } catch (error: any) {
    errorMensaje.value =
      error.response?.data?.message || 'Error al guardar pensionado';
  } finally {
    guardando.value = false;
  }
};

const confirmarEliminar = (id: number) => {
  idAEliminar.value = id;
  mostrarConfirmarEliminar.value = true;
};

const eliminarPensionadoConfirmado = async () => {
  if (idAEliminar.value === null) return;
  eliminando.value = true;
  try {
    await api.delete(`/pensionados/${idAEliminar.value}`);
    mostrarConfirmarEliminar.value = false;
    await cargarPensionados();
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
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const obtenerPlatosPagados = (pago: any) => {
  if (pago.cantidadCompletos && Number(pago.cantidadCompletos) > 0) {
    return Number(pago.cantidadCompletos);
  }
  const precio = parseFloat(String(pago.precioUnitario || 0));
  const monto = parseFloat(String(pago.montoTotal || 0));
  if (precio > 0 && monto > 0) {
    return Math.round(monto / precio);
  }
  return pago.pension?.cantidadCompletos || '-';
};

const obtenerMetodoPago = (pago: any) => {
  return pago?.metodoPago || pago?.metodo_pago || 'Efectivo';
};

onMounted(() => {
  cargarPensionados();
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
          Directorio de Pensionados
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Gestión de clientes afiliados, estados de cuenta y ficha de consumo 360°.
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

    <!-- Buscador -->
    <div
      style="
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 0.75rem;
      "
    >
      <i class="pi pi-search" style="color: #94a3b8;"></i>
      <InputText
        v-model="busqueda"
        placeholder="Buscar pensionado por nombre o apellido..."
        style="width: 100%; border: none; font-size: 0.95rem;"
      />
      <Button
        v-if="busqueda"
        icon="pi pi-times"
        severity="secondary"
        text
        rounded
        @click="busqueda = ''"
      />
    </div>

    <!-- Tabla Principal -->
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
        :value="pensionadosFiltrados"
        :loading="cargando"
        stripedRows
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <template #empty>
          <div style="text-align: center; padding: 2rem; color: #94a3b8;">
            No se encontraron pensionados registrados.
          </div>
        </template>

        <Column field="nombreCompleto" header="Nombre Completo" style="font-weight: 600; color: #1e293b;">
          <template #body="slotProps">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div
                style="
                  background: #e2e8f0;
                  color: #334155;
                  width: 34px;
                  height: 34px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 0.85rem;
                "
              >
                {{ slotProps.data.nombreCompleto.charAt(0).toUpperCase() }}
              </div>
              <span>{{ slotProps.data.nombreCompleto }}</span>
            </div>
          </template>
        </Column>

        <Column field="telefono" header="Teléfono" style="color: #475569;">
          <template #body="slotProps">
            <span v-if="slotProps.data.telefono">
              <i class="pi pi-phone" style="font-size: 0.8rem; margin-right: 0.35rem; color: #64748b;"></i>
              {{ slotProps.data.telefono }}
            </span>
            <span v-else style="color: #94a3b8; font-style: italic;">Sin teléfono</span>
          </template>
        </Column>

        <Column field="estado" header="Estado" style="width: 120px; text-align: center;">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.estado ? 'Activo' : 'Inactivo'"
              :severity="slotProps.data.estado ? 'success' : 'danger'"
              rounded
            />
          </template>
        </Column>

        <Column header="Acciones y Ficha" style="width: 220px; text-align: center;">
          <template #body="slotProps">
            <Button
              label="Ver Ficha"
              icon="pi pi-id-card"
              severity="info"
              size="small"
              style="margin-right: 0.4rem; padding: 0.4rem 0.65rem; font-size: 0.8rem;"
              @click="verFicha360(slotProps.data)"
            />
            <Button
              icon="pi pi-pencil"
              severity="warning"
              text
              rounded
              title="Editar Pensionado"
              @click="editarPensionado(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              title="Eliminar Pensionado"
              @click="confirmarEliminar(slotProps.data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- DIALOGO PERFIL 360° / FICHA DEL PENSIONADO -->
    <Dialog
      v-model:visible="visibleFicha"
      modal
      :header="`Ficha Integral del Pensionado: ${pensionadoFicha?.nombreCompleto || ''}`"
      :style="{ width: '800px', maxWidth: '95vw' }"
    >
      <div v-if="cargandoFicha" style="text-align: center; padding: 3rem;">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #3b82f6;"></i>
        <p style="margin-top: 1rem; color: #64748b;">Cargando historial de la cuenta...</p>
      </div>

      <div v-else-if="pensionadoFicha" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Banner de Estado de Pensión Activa -->
        <div
          v-if="pensioneActivaFicha"
          style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          "
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase;">
                Pensión Actual #{{ pensioneActivaFicha.id }} (Iniciada: {{ formatFecha(pensioneActivaFicha.fechaInicio) }})
              </span>
              <div style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 0.2rem;">
                {{ pensioneActivaFicha.completosDisponibles }} platos disponibles de {{ pensioneActivaFicha.cantidadCompletos }}
              </div>
            </div>
            <Tag
              :value="pensioneActivaFicha.estado"
              :severity="pensioneActivaFicha.estado === 'ACTIVA' ? 'success' : 'warn'"
              rounded
              style="font-size: 0.85rem; padding: 0.35rem 0.75rem;"
            />
          </div>

          <!-- Barra de Progreso de Consumo -->
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">
              <span>Consumidos: {{ pensioneActivaFicha.cantidadCompletos - pensioneActivaFicha.completosDisponibles }}</span>
              <span>{{ porcentajeConsumoActiva }}% del paquete</span>
            </div>
            <ProgressBar :value="porcentajeConsumoActiva" :showValue="false" style="height: 8px;" />
          </div>
        </div>

        <div
          v-else
          style="
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 12px;
            padding: 1rem;
            color: #b45309;
            font-size: 0.9rem;
          "
        >
          <i class="pi pi-info-circle" style="margin-right: 0.4rem;"></i>
          Este pensionado no tiene ninguna pensión activa actualmente.
        </div>

        <!-- Tarjetas de Métricas Rápidas -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Total Consumos</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #3b82f6;">
              {{ todosLosConsumosFicha.length }}
            </div>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Total Pagado</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #10b981;">
              Bs. {{ totalMontoPagadoFicha.toFixed(2) }}
            </div>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; text-align: center;">
            <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">Extras Acumulados</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b;">
              Bs. {{ totalMontoExtrasFicha.toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Pestañas de Navegación del Historial -->
        <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.25rem;">
          <button
            style="padding: 0.6rem 1rem; font-weight: 700; border: none; background: none; cursor: pointer; border-radius: 8px; font-size: 0.85rem;"
            :style="tabActivo === 'consumos' ? 'background: #eff6ff; color: #2563eb;' : 'color: #64748b;'"
            @click="tabActivo = 'consumos'"
          >
            🍽️ Historial de Consumos ({{ todosLosConsumosFicha.length }})
          </button>
          <button
            style="padding: 0.6rem 1rem; font-weight: 700; border: none; background: none; cursor: pointer; border-radius: 8px; font-size: 0.85rem;"
            :style="tabActivo === 'pagos' ? 'background: #ecfdf5; color: #059669;' : 'color: #64748b;'"
            @click="tabActivo = 'pagos'"
          >
            💵 Historial de Pagos ({{ todosLosPagosFicha.length }})
          </button>
          <button
            style="padding: 0.6rem 1rem; font-weight: 700; border: none; background: none; cursor: pointer; border-radius: 8px; font-size: 0.85rem;"
            :style="tabActivo === 'extras' ? 'background: #fffbeb; color: #d97706;' : 'color: #64748b;'"
            @click="tabActivo = 'extras'"
          >
            ⭐ Extras ({{ todosLosExtrasFicha.length }})
          </button>
        </div>

        <!-- Contenido de Pestaña Consumos -->
        <div v-if="tabActivo === 'consumos'" style="max-height: 250px; overflow-y: auto;">
          <DataTable :value="todosLosConsumosFicha" class="p-datatable-sm" stripedRows>
            <template #empty>Sin consumos registrados</template>
            <Column header="Fecha" style="width: 140px;">
              <template #body="slotProps">{{ formatFecha(slotProps.data.fecha) }}</template>
            </Column>
            <Column header="Plato Servido">
              <template #body="slotProps">
                <Tag :value="slotProps.data.opcionMenu?.nombreSegundo || 'No especificado'" severity="info" />
              </template>
            </Column>
            <Column field="cantidadCompletos" header="Cantidad" style="width: 100px; text-align: center;" />
            <Column field="tipoConsumo" header="Modalidad" style="color: #64748b;" />
          </DataTable>
        </div>

        <!-- Contenido de Pestaña Pagos -->
        <div v-if="tabActivo === 'pagos'" style="max-height: 250px; overflow-y: auto;">
          <DataTable :value="todosLosPagosFicha" class="p-datatable-sm" stripedRows>
            <template #empty>Sin pagos registrados</template>
            <Column header="Fecha Pago" style="width: 120px;">
              <template #body="slotProps">{{ formatFecha(slotProps.data.fechaPago) }}</template>
            </Column>
            <Column header="Platos Pagados" style="width: 130px; text-align: center;">
              <template #body="slotProps">
                <span style="font-weight: 700; color: #2563eb;">
                  {{ obtenerPlatosPagados(slotProps.data) }} platos
                </span>
              </template>
            </Column>
            <Column field="precioUnitario" header="Precio Unitario" style="text-align: right;">
              <template #body="slotProps">Bs. {{ Number(slotProps.data.precioUnitario).toFixed(2) }}</template>
            </Column>
            <Column field="montoTotal" header="Monto Total Pagado" style="font-weight: 800; color: #10b981; text-align: right;">
              <template #body="slotProps">Bs. {{ Number(slotProps.data.montoTotal).toFixed(2) }}</template>
            </Column>
            <Column header="Método" style="width: 140px; text-align: center;">
              <template #body="slotProps">
                <span style="font-weight: 600; color: #475569;">
                  {{ obtenerMetodoPago(slotProps.data) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Contenido de Pestaña Extras -->
        <div v-if="tabActivo === 'extras'" style="max-height: 250px; overflow-y: auto;">
          <DataTable :value="todosLosExtrasFicha" class="p-datatable-sm" stripedRows>
            <template #empty>Sin extras registrados</template>
            <Column header="Fecha" style="width: 140px;">
              <template #body="slotProps">{{ formatFecha(slotProps.data.fecha) }}</template>
            </Column>
            <Column field="descripcion" header="Descripción" />
            <Column field="precio" header="Precio" style="font-weight: 700; color: #f59e0b;">
              <template #body="slotProps">Bs. {{ Number(slotProps.data.precio).toFixed(2) }}</template>
            </Column>
          </DataTable>
        </div>
      </div>
    </Dialog>

    <!-- Dialogo Creación/Edición -->
    <Dialog
      v-model:visible="visible"
      modal
      :header="modoEdicion ? 'Editar Pensionado' : 'Nuevo Pensionado'"
      :style="{ width: '450px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1.25rem; padding-top: 0.5rem;">
        <Message v-if="errorMensaje" severity="error" :closable="false">
          {{ errorMensaje }}
        </Message>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Nombre Completo *</label>
          <InputText
            v-model="nombreCompleto"
            placeholder="Ej: Juan Pérez Morales"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Teléfono / Celular</label>
          <InputText
            v-model="telefono"
            placeholder="Ej: 71234567"
            style="padding: 0.75rem 1rem;"
            fluid
          />
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
          <Checkbox v-model="estado" binary id="estado-pensionado" />
          <label for="estado-pensionado" style="font-weight: 600; color: #475569; font-size: 0.9rem; cursor: pointer;">
            Pensionado Activo
          </label>
        </div>

        <Button
          label="Guardar Pensionado"
          icon="pi pi-save"
          severity="success"
          :loading="guardando"
          style="margin-top: 0.5rem; padding: 0.75rem; font-weight: 600;"
          fluid
          @click="guardarPensionado"
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
            ¿Eliminar Pensionado?
          </h3>
          <p style="margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">
            Se archivará el registro del pensionado conservando su histórico de datos.
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
            @click="eliminarPensionadoConfirmado"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>