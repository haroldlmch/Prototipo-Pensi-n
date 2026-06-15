<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';

import api from '../api/axios';

interface Configuracion {
  id: number;
  precioPensionado: number | string;
  precioCasual: number | string;
  precioExtra: number | string;
  saldoBajoAlerta: number;
  fechaActualizacion?: string;
}

const configuracionId = ref<number | null>(null);
const precioPensionado = ref<number | null>(null);
const precioCasual = ref<number | null>(null);
const precioExtra = ref<number | null>(null);
const saldoBajoAlerta = ref<number | null>(null);
const fechaActualizacion = ref('');

const cargando = ref(false);
const guardando = ref(false);
const mensaje = ref('');
const tipoMensaje = ref<'success' | 'error'>('success');

const formularioValido = computed(
  () =>
    configuracionId.value !== null &&
    precioPensionado.value !== null &&
    precioPensionado.value >= 0 &&
    precioCasual.value !== null &&
    precioCasual.value >= 0 &&
    precioExtra.value !== null &&
    precioExtra.value >= 0 &&
    saldoBajoAlerta.value !== null &&
    saldoBajoAlerta.value >= 0,
);

const obtenerMensajeError = (error: unknown) => {
  const posibleError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const detalle = posibleError.response?.data?.message;

  if (Array.isArray(detalle)) return detalle.join('. ');
  return detalle ?? 'No se pudo completar la operación.';
};

const cargarConfiguracion = async () => {
  cargando.value = true;
  mensaje.value = '';

  try {
    const response = await api.get('/configuracion');
    const datos: Configuracion = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    configuracionId.value = datos.id;
    precioPensionado.value = Number(datos.precioPensionado);
    precioCasual.value = Number(datos.precioCasual);
    precioExtra.value = Number(datos.precioExtra);
    saldoBajoAlerta.value = datos.saldoBajoAlerta;
    fechaActualizacion.value = datos.fechaActualizacion ?? '';
  } catch (error) {
    tipoMensaje.value = 'error';
    mensaje.value = obtenerMensajeError(error);
  } finally {
    cargando.value = false;
  }
};

const guardarConfiguracion = async () => {
  if (!formularioValido.value) {
    tipoMensaje.value = 'error';
    mensaje.value = 'Complete todos los valores de configuración.';
    return;
  }

  guardando.value = true;
  mensaje.value = '';

  try {
    const response = await api.patch(`/configuracion/${configuracionId.value}`, {
      precioPensionado: Number(precioPensionado.value),
      precioCasual: Number(precioCasual.value),
      precioExtra: Number(precioExtra.value),
      saldoBajoAlerta: Number(saldoBajoAlerta.value),
    });

    fechaActualizacion.value = response.data.fechaActualizacion ?? '';
    tipoMensaje.value = 'success';
    mensaje.value = 'Configuración guardada correctamente.';
  } catch (error) {
    tipoMensaje.value = 'error';
    mensaje.value = obtenerMensajeError(error);
  } finally {
    guardando.value = false;
  }
};

const formatearFecha = (valor: string) => {
  if (!valor) return '';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(valor));
};

onMounted(cargarConfiguracion);
</script><template>
  <div style="display: flex; flex-direction: column; gap: 1.5rem;">
    <!-- Cabecera -->
    <div class="encabezado">
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
          Configuración
        </h1>
        <p style="margin: 0.25rem 0 0 0; color: #64748b; font-size: 0.95rem; font-weight: 500;">
          Parámetros y precios globales utilizados por el sistema.
        </p>
      </div>
    </div>

    <Message
      v-if="mensaje"
      :severity="tipoMensaje"
      :closable="false"
    >
      {{ mensaje }}
    </Message>

    <!-- Skeleton mientras carga -->
    <div v-if="cargando" style="display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-size: 0.95rem;">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.25rem; color: #3b82f6;"></i>
      Cargando configuración...
    </div>

    <!-- Tarjetas de configuración -->
    <div v-else class="cuadricula">
      <!-- Card: Precios -->
      <div class="config-card">
        <div class="config-card-header">
          <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #1d4ed8; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-money-bill" style="font-size: 1.1rem;"></i>
          </div>
          <div>
            <h2 class="config-card-title">Precios</h2>
            <p class="config-card-sub">Importes predeterminados en bolivianos (Bs.)</p>
          </div>
        </div>

        <div class="formulario">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label class="campo-label">Precio por completo para pensionado</label>
            <InputNumber
              v-model="precioPensionado"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label class="campo-label">Precio para venta casual</label>
            <InputNumber
              v-model="precioCasual"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label class="campo-label">Precio sugerido para extras</label>
            <InputNumber
              v-model="precioExtra"
              mode="currency"
              currency="BOB"
              locale="es-BO"
              :min="0"
              fluid
            />
          </div>
        </div>
      </div>

      <!-- Card: Alertas -->
      <div class="config-card">
        <div class="config-card-header">
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #b45309; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-bell" style="font-size: 1.1rem;"></i>
          </div>
          <div>
            <h2 class="config-card-title">Alertas</h2>
            <p class="config-card-sub">Control de completos disponibles</p>
          </div>
        </div>

        <div class="formulario">
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label class="campo-label">Alertar cuando el saldo sea igual o menor a</label>
            <InputNumber
              v-model="saldoBajoAlerta"
              :min="0"
              showButtons
              fluid
            />
          </div>

          <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 0.85rem 1rem; display: flex; gap: 0.6rem; align-items: flex-start;">
            <i class="pi pi-info-circle" style="color: #ca8a04; font-size: 1rem; margin-top: 0.1rem;"></i>
            <span style="font-size: 0.85rem; color: #92400e; line-height: 1.5;">
              Las pensiones con completos disponibles iguales o menores a este valor
              aparecerán como <strong>alertas</strong> en el dashboard.
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones -->
    <div v-if="!cargando" class="acciones">
      <span v-if="fechaActualizacion" style="color: #94a3b8; font-size: 0.82rem;">
        <i class="pi pi-clock" style="margin-right: 0.3rem;"></i>
        Última actualización: {{ formatearFecha(fechaActualizacion) }}
      </span>

      <Button
        label="Guardar Configuración"
        icon="pi pi-save"
        :loading="guardando"
        :disabled="!formularioValido"
        raised
        @click="guardarConfiguracion"
      />
    </div>
  </div>
</template>

<style scoped>
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cuadricula {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.5rem;
}

.config-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.config-card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.config-card-sub {
  margin: 0.15rem 0 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.campo-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #475569;
}

.acciones {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}
</style>
