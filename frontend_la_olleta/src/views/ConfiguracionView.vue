<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Tag from 'primevue/tag';

import api from '../api/axios';

interface Configuracion {
  id: number;
  precioPensionado: number | string;
  precioCasual: number | string;
  saldoBajoAlerta: number;
  fechaActualizacion?: string;
}

const configuracionId = ref<number | null>(null);
const precioPensionado = ref<number | null>(null);
const precioCasual = ref<number | null>(null);
const saldoBajoAlerta = ref<number | null>(null);
const fechaActualizacion = ref('');

// WhatsApp Bot State
const wsConnected = ref(false);
const wsTargetGroup = ref('');
const wsGuardandoGrupo = ref(false);
const wsMensaje = ref('');

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

const cargarWhatsappStatus = async () => {
  try {
    const res = await api.get('/whatsapp/status');
    wsConnected.value = res.data.connected;
    wsTargetGroup.value = res.data.targetGroupId || '';
  } catch (error) {
    console.error('Error al obtener estado de WhatsApp:', error);
  }
};

const guardarWhatsappGrupo = async () => {
  wsGuardandoGrupo.value = true;
  wsMensaje.value = '';
  try {
    await api.post('/whatsapp/set-group', {
      groupId: wsTargetGroup.value.trim(),
    });
    wsMensaje.value = 'Grupo de WhatsApp actualizado correctamente.';
  } catch (error) {
    wsMensaje.value = 'Error al actualizar grupo de WhatsApp.';
  } finally {
    wsGuardandoGrupo.value = false;
  }
};

onMounted(() => {
  cargarConfiguracion();
  cargarWhatsappStatus();
});
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
          Parámetros globales, precios e integración de WhatsApp para pedidos.
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
          <div style="background: linear-gradient(135deg, #ffedd5, #fed7aa); color: #ea580c; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.2);">
            <i class="pi pi-dollar" style="font-size: 1.1rem; font-weight: 700;"></i>
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
        </div>
      </div>

      <!-- Card: Alertas -->
      <div class="config-card">
        <div class="config-card-header">
          <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); color: #b45309; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.2);">
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

          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 0.85rem 1rem; display: flex; gap: 0.6rem; align-items: flex-start;">
            <i class="pi pi-info-circle" style="color: #ea580c; font-size: 1rem; margin-top: 0.1rem;"></i>
            <span style="font-size: 0.85rem; color: #9a3412; line-height: 1.5;">
              Las pensiones con completos disponibles iguales o menores a este valor
              aparecerán como <strong>alertas</strong> en el dashboard.
            </span>
          </div>
        </div>
      </div>

      <!-- Card: Bot de Pedidos WhatsApp -->
      <div class="config-card" style="grid-column: 1 / -1;">
        <div class="config-card-header" style="justify-content: space-between;">
          <div style="display: flex; gap: 0.85rem; align-items: center;">
            <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.2);">
              <i class="pi pi-whatsapp" style="font-size: 1.3rem; font-weight: 700;"></i>
            </div>
            <div>
              <h2 class="config-card-title">Bot de Pedidos por WhatsApp</h2>
              <p class="config-card-sub">Recepción automática y descuento de almuerzos de pensión</p>
            </div>
          </div>
          <div>
            <Tag
              :value="wsConnected ? 'Activo & Conectado' : 'Conectando / Desconectado'"
              :severity="wsConnected ? 'success' : 'warn'"
              :icon="wsConnected ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"
              style="font-weight: 700; padding: 0.4rem 0.85rem;"
            />
          </div>
        </div>

        <Message v-if="wsMensaje" severity="info" :closable="true" style="margin-top: 0.5rem;">
          {{ wsMensaje }}
        </Message>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
          <!-- Columna Izquierda: Configuración de Grupo -->
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <label class="campo-label">ID de Grupo de WhatsApp Asignado</label>
            <div style="display: flex; gap: 0.5rem;">
              <InputText
                v-model="wsTargetGroup"
                placeholder="Ej: 120363293340256520@g.us (Vacío = todos)"
                style="flex: 1; font-size: 0.85rem;"
              />
              <Button
                label="Asignar Grupo"
                icon="pi pi-check"
                severity="success"
                :loading="wsGuardandoGrupo"
                @click="guardarWhatsappGrupo"
              />
            </div>
            <span style="font-size: 0.8rem; color: #64748b;">
              Escribe <code>#id_grupo</code> en cualquier grupo de WhatsApp y el bot te dirá su ID para pegarlo aquí.
            </span>
          </div>

          <!-- Columna Derecha: Guía rápida -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
            <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              <i class="pi pi-book" style="color: #16a34a;"></i>
              Comandos para los Clientes en WhatsApp:
            </div>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.82rem; color: #475569; display: flex; flex-direction: column; gap: 0.35rem;">
              <li><code>#pedido 1</code>: Pide la 1ª opción del menú de hoy.</li>
              <li><code>#pedido 2</code>: Pide la 2ª opción del menú de hoy.</li>
              <li><code>#pedido Pollo al horno</code>: Busca el plato por coincidencia de texto.</li>
              <li>El bot verifica que el número sea pensionado y tenga almuerzos disponibles antes de registrarlo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones -->
    <div v-if="!cargando" class="acciones">
      <span v-if="fechaActualizacion" style="color: #78716c; font-size: 0.82rem;">
        <i class="pi pi-clock" style="margin-right: 0.3rem;"></i>
        Última actualización: {{ formatearFecha(fechaActualizacion) }}
      </span>

      <Button
        label="Guardar Configuración"
        icon="pi pi-save"
        :loading="guardando"
        :disabled="!formularioValido"
        raised
        style="
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
          border: none !important;
          color: white !important;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35) !important;
        "
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
  border: 1px solid #fed7aa;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
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
