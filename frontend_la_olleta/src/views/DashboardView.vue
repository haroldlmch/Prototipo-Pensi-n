<script setup lang="ts">
import { onMounted, ref } from 'vue';

import Card from 'primevue/card';

import api from '../api/axios';

const resumen = ref({
  pensionadosActivos: 0,
  pensionesActivas: 0,
  consumosRegistrados: 0,
  ventasCasuales: 0,
});

const cargando = ref(true);

const cargarResumen = async () => {
  try {
    const response = await api.get('/dashboard/resumen');

    resumen.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarResumen();
});
</script>

<template>
  <div style="padding: 2rem">
    <h1>Dashboard</h1>

    <p v-if="cargando">
      Cargando...
    </p>

    <div
      v-else
      style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      "
    >
      <Card>
        <template #title>
          Pensionados
        </template>

        <template #content>
          <h2>{{ resumen.pensionadosActivos }}</h2>
        </template>
      </Card>

      <Card>
        <template #title>
          Pensiones
        </template>

        <template #content>
          <h2>{{ resumen.pensionesActivas }}</h2>
        </template>
      </Card>

      <Card>
        <template #title>
          Consumos
        </template>

        <template #content>
          <h2>{{ resumen.consumosRegistrados }}</h2>
        </template>
      </Card>

      <Card>
        <template #title>
          Ventas Casuales
        </template>

        <template #content>
          <h2>{{ resumen.ventasCasuales }}</h2>
        </template>
      </Card>
    </div>
  </div>
</template>