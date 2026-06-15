<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Button from 'primevue/button';
import Card from 'primevue/card';
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
</script>

<template>
  <div>
    <div class="encabezado">
      <div>
        <h1>Configuración</h1>
        <p>Valores generales utilizados por el sistema</p>
      </div>
    </div>

    <Message
      v-if="mensaje"
      :severity="tipoMensaje"
      :closable="false"
      class="mensaje"
    >
      {{ mensaje }}
    </Message>

    <p v-if="cargando">Cargando configuración...</p>

    <div
      v-else
      class="cuadricula"
    >
      <Card>
        <template #title>Precios</template>
        <template #subtitle>Importes predeterminados en bolivianos</template>
        <template #content>
          <div class="formulario">
            <label>
              Precio para pensionado
              <InputNumber
                v-model="precioPensionado"
                mode="currency"
                currency="BOB"
                locale="es-BO"
                :min="0"
                fluid
              />
            </label>

            <label>
              Precio para venta casual
              <InputNumber
                v-model="precioCasual"
                mode="currency"
                currency="BOB"
                locale="es-BO"
                :min="0"
                fluid
              />
            </label>

            <label>
              Precio sugerido para extras
              <InputNumber
                v-model="precioExtra"
                mode="currency"
                currency="BOB"
                locale="es-BO"
                :min="0"
                fluid
              />
            </label>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>Alertas</template>
        <template #subtitle>Control de completos disponibles</template>
        <template #content>
          <div class="formulario">
            <label>
              Alertar cuando el saldo sea igual o menor a
              <InputNumber
                v-model="saldoBajoAlerta"
                :min="0"
                showButtons
                fluid
              />
            </label>

            <small>
              Este valor permitirá identificar pensiones próximas a quedarse sin
              completos.
            </small>
          </div>
        </template>
      </Card>
    </div>

    <div
      v-if="!cargando"
      class="acciones"
    >
      <small v-if="fechaActualizacion">
        Última actualización: {{ formatearFecha(fechaActualizacion) }}
      </small>

      <Button
        label="Guardar Configuración"
        icon="pi pi-save"
        :loading="guardando"
        :disabled="!formularioValido"
        @click="guardarConfiguracion"
      />
    </div>
  </div>
</template>

<style scoped>
.encabezado {
  margin-bottom: 1rem;
}

.encabezado h1,
.encabezado p {
  margin: 0;
}

.encabezado p {
  margin-top: 0.25rem;
  color: #6b7280;
}

.mensaje {
  margin-bottom: 1rem;
}

.cuadricula {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.formulario label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 600;
}

.formulario small,
.acciones small {
  color: #6b7280;
}

.acciones {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
