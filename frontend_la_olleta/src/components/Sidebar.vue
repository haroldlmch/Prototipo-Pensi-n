<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const navegar = (ruta: string) => {
  router.push(ruta);
};

const salir = () => {
  localStorage.removeItem('token');
  router.push('/login');
};

const esActiva = (ruta: string) => {
  return route.path === ruta;
};

const itemsMenu = [
  { label: 'Dashboard', ruta: '/dashboard', icono: 'pi pi-chart-bar' },
  { label: 'Pensionados', ruta: '/pensionados', icono: 'pi pi-users' },
  { label: 'Menús', ruta: '/menus', icono: 'pi pi-book' },
  { label: 'Opciones Menú', ruta: '/opciones-menu', icono: 'pi pi-list' },
  { label: 'Pensiones', ruta: '/pensiones', icono: 'pi pi-calendar' },
  { label: 'Consumos', ruta: '/consumos', icono: 'pi pi-check-circle' },
  { label: 'Pagos', ruta: '/pagos', icono: 'pi pi-wallet' },
  { label: 'Extras', ruta: '/extras', icono: 'pi pi-star' },
  { label: 'Ventas Casuales', ruta: '/ventas-casuales', icono: 'pi pi-shopping-cart' },
  { label: 'Configuración', ruta: '/configuracion', icono: 'pi pi-cog' },
];
</script>

<template>
  <div
    style="
      width: 260px;
      height: 100vh;
      background: #0f172a;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      border-right: 1px solid #1e293b;
      box-shadow: 4px 0 10px rgba(0,0,0,0.05);
      flex-shrink: 0;
    "
  >
    <!-- Brand / Logo -->
    <div
      style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem 1.5rem 0.75rem;
        border-bottom: 1px solid #1e293b;
        margin-bottom: 1rem;
      "
    >
      <div
        style="
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12h20" />
          <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
          <path d="m4 8 16-4" />
          <path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.45l.45 1.81" />
        </svg>
      </div>
      <h2
        style="
          margin: 0;
          color: white;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.025em;
        "
      >
        La O'lleta
      </h2>
    </div>

    <!-- Navigation Items -->
    <div
      v-for="item in itemsMenu"
      :key="item.ruta"
      style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        color: #94a3b8;
        font-weight: 500;
        font-size: 0.925rem;
        cursor: pointer;
        transition: all 0.2s ease;
      "
      :style="
        esActiva(item.ruta)
          ? 'background: #1e293b; color: white; font-weight: 600; box-shadow: inset 3px 0 0 #3b82f6;'
          : ''
      "
      @click="navegar(item.ruta)"
      @mouseover="($event.currentTarget as HTMLElement).style.background = esActiva(item.ruta) ? '#1e293b' : '#1e293b80'"
      @mouseleave="($event.currentTarget as HTMLElement).style.background = esActiva(item.ruta) ? '#1e293b' : 'transparent'"
    >
      <i :class="item.icono" style="font-size: 1.1rem;" :style="esActiva(item.ruta) ? 'color: #3b82f6;' : ''"></i>
      <span>{{ item.label }}</span>
    </div>

    <div style="flex: 1"></div>

    <!-- Logout -->
    <div
      style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        color: #fca5a5;
        font-weight: 500;
        font-size: 0.925rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px dashed rgba(239, 68, 68, 0.2);
        margin-top: 1rem;
      "
      @click="salir"
      @mouseover="($event.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)'"
      @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
    >
      <i class="pi pi-sign-out" style="font-size: 1.1rem;"></i>
      <span>Cerrar sesión</span>
    </div>
  </div>
</template>
