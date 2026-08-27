<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const navegar = (ruta: string) => {
  router.push(ruta);
};

const salir = () => {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
  router.push('/login');
};

const esActiva = (ruta: string) => {
  return route.path === ruta;
};

const secciones = [
  {
    titulo: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', ruta: '/dashboard', icono: 'pi pi-objects-column' },
    ],
  },
  {
    titulo: 'OPERACIÓN DIARIA',
    items: [
      { label: 'Menú del Día', ruta: '/menus', icono: 'pi pi-clipboard' },
      { label: 'Consumos (Comedor)', ruta: '/consumos', icono: 'pi pi-calendar-clock' },
      { label: 'Ventas Casuales', ruta: '/ventas-casuales', icono: 'pi pi-shop' },
      { label: 'Extras', ruta: '/extras', icono: 'pi pi-sparkles' },
    ],
  },
  {
    titulo: 'GESTIÓN DE CLIENTES',
    items: [
      { label: 'Pensionados', ruta: '/pensionados', icono: 'pi pi-address-book' },
      { label: 'Pensiones', ruta: '/pensiones', icono: 'pi pi-calendar-plus' },
      { label: 'Pagos', ruta: '/pagos', icono: 'pi pi-wallet' },
    ],
  },
  {
    titulo: 'FINANZAS Y REPORTES',
    items: [
      { label: 'Ganancias y Reportes', ruta: '/ganancias', icono: 'pi pi-chart-line' },
    ],
  },
  {
    titulo: 'SISTEMA',
    items: [
      { label: 'Configuración', ruta: '/configuracion', icono: 'pi pi-sliders-h' },
    ],
  },
];
</script>

<template>
  <aside class="sidebar-container">
    <!-- Brand / Logo -->
    <div class="brand-box">
      <div class="brand-icon">
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
      <div>
        <h2 class="brand-title">L'OLLETA</h2>
        <span class="brand-subtitle">Gestión de Pensiones</span>
      </div>
    </div>

    <!-- Navigation Menu Grouped -->
    <nav class="nav-container">
      <div v-for="seccion in secciones" :key="seccion.titulo" class="nav-section">
        <div class="section-label">{{ seccion.titulo }}</div>

        <div
          v-for="item in seccion.items"
          :key="item.ruta"
          class="nav-item"
          :class="{ active: esActiva(item.ruta) }"
          @click="navegar(item.ruta)"
        >
          <i :class="item.icono" class="nav-icon"></i>
          <span class="nav-text">{{ item.label }}</span>
        </div>
      </div>
    </nav>

    <!-- Logout -->
    <div class="logout-btn" @click="salir">
      <i class="pi pi-sign-out"></i>
      <span>Cerrar sesión</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-container {
  width: 260px;
  height: 100vh;
  background: #1c1917; /* Stone 900 */
  padding: 1.25rem 0.85rem;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #292524; /* Stone 800 */
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  user-select: none;
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.5rem 1.25rem 0.5rem;
  border-bottom: 1px solid #292524;
  margin-bottom: 0.75rem;
}

.brand-icon {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35);
}

.brand-title {
  margin: 0;
  color: #fafaf9;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  color: #a8a29e;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.nav-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-right: 0.25rem;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #78716c; /* Stone 500 */
  letter-spacing: 0.08em;
  padding: 0 0.65rem 0.25rem 0.65rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  color: #a8a29e;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: #292524;
  color: #fafaf9;
}

.nav-item.active {
  background: #292524;
  color: #ffffff;
  font-weight: 700;
  box-shadow: inset 3px 0 0 #ea580c;
}

.nav-item.active .nav-icon {
  color: #f97316;
}

.nav-icon {
  font-size: 1.05rem;
  transition: color 0.15s ease;
}

.nav-text {
  letter-spacing: -0.01em;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  color: #f87171;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px dashed rgba(239, 68, 68, 0.25);
  margin-top: 0.5rem;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.4);
}
</style>
