<script setup lang="ts">
import { useRouter } from 'vue-router';
import Button from 'primevue/button';

const router = useRouter();

const navegar = (ruta: string) => {
  router.push(ruta);
};

const salir = () => {
  localStorage.removeItem('token');
  router.push('/login');
};
</script>

<template>
  <div
    style="
      width: 250px;
      height: 100vh;
      background: #f8f9fa;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      border-right: 1px solid #ddd;
    "
  >
    <h2>La O'lleta</h2>

    <Button label="Dashboard" @click="navegar('/dashboard')" />
    <Button label="Pensionados" @click="navegar('/pensionados')" />
    <Button label="Menús" @click="navegar('/menus')" />
    <Button
  label="Opciones Menú"
  @click="navegar('/opciones-menu')"
/>
    <Button label="Pensiones" @click="navegar('/pensiones')" />
    <Button label="Consumos" @click="navegar('/consumos')" />
    <Button label="Pagos" @click="navegar('/pagos')" />
    <Button label="Extras" @click="navegar('/extras')" />
    <Button label="Ventas Casuales" @click="navegar('/ventas-casuales')" />

    <div style="flex: 1"></div>

    <Button
      severity="danger"
      label="Cerrar sesión"
      @click="salir"
    />
  </div>
</template>