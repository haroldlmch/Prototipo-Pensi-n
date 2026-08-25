<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import api from '../api/axios';

const route = useRoute();
const router = useRouter();

const titulosRuta: Record<string, string> = {
  '/dashboard': 'Panel Principal & Métricas',
  '/menus': 'Planificación del Menú del Día',
  '/consumos': 'Control de Comedor y Despacho',
  '/ventas-casuales': 'Ventas Casuales de Mostrador',
  '/extras': 'Control de Extras & Bebidas',
  '/pensionados': 'Directorio de Pensionados (Ficha 360°)',
  '/pensiones': 'Contratos y Paquetes de Pensión',
  '/pagos': 'Facturación y Recaudación de Pagos',
  '/configuracion': 'Configuración de Precios y Sistema',
};

const tituloActual = computed(() => titulosRuta[route.path] || 'Sistema de Gestión');

// Reloj y fecha en tiempo real
const horaActual = ref('');
const fechaActual = ref('');

const actualizarHoraFecha = () => {
  const ahora = new Date();
  horaActual.value = ahora.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  fechaActual.value = ahora.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Verificación en vivo de si hay Menú del Día registrado para hoy
const tieneMenuHoy = ref<boolean | null>(null);

const obtenerFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const verificarMenuHoy = async () => {
  try {
    const fecha = obtenerFechaLocal();
    const res = await api.get(`/menus/fecha/${fecha}`);
    if (res.data && res.data.id) {
      tieneMenuHoy.value = true;
    } else {
      tieneMenuHoy.value = false;
    }
  } catch {
    tieneMenuHoy.value = false;
  }
};

let intervaloReloj: ReturnType<typeof setInterval> | null = null;
let intervaloMenu: ReturnType<typeof setInterval> | null = null;

watch(
  () => route.path,
  () => {
    verificarMenuHoy();
  },
);

onMounted(() => {
  actualizarHoraFecha();
  verificarMenuHoy();
  intervaloReloj = setInterval(actualizarHoraFecha, 1000);
  intervaloMenu = setInterval(verificarMenuHoy, 30000); // Revalidar cada 30 segundos
});

onUnmounted(() => {
  if (intervaloReloj) clearInterval(intervaloReloj);
  if (intervaloMenu) clearInterval(intervaloMenu);
});
</script>

<template>
  <div class="layout-wrapper">
    <Sidebar />

    <div class="layout-main">
      <!-- Topbar Ejecutiva -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="breadcrumb-prefix">La O'lleta /</span>
          <h2 class="breadcrumb-title">{{ tituloActual }}</h2>
        </div>

        <div class="topbar-right">
          <!-- Estado en Vivo Conectado a Menú de Hoy -->
          <div
            class="badge-status"
            :class="tieneMenuHoy ? 'status-active' : 'status-pending'"
            :title="tieneMenuHoy ? 'Menú del día publicado y servicio activo' : 'Haga clic para registrar el menú de hoy'"
            @click="router.push('/menus')"
          >
            <span class="status-dot"></span>
            <span class="status-text">
              {{ tieneMenuHoy ? 'Servicio Activo' : 'Menú Pendiente' }}
            </span>
          </div>

          <!-- Reloj y Fecha -->
          <div class="datetime-pill">
            <i class="pi pi-clock" style="font-size: 0.85rem; color: #64748b;"></i>
            <span class="datetime-text">{{ fechaActual }} · {{ horaActual }}</span>
          </div>

          <!-- Perfil Usuario -->
          <div class="user-pill">
            <div class="user-avatar">A</div>
            <div class="user-info">
              <span class="user-name">Administrador</span>
              <span class="user-role">Caja Central</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Contenido Principal con Transición Suave -->
      <main class="content-body">
        <RouterView v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #fafaf9; /* Stone 50 */
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.topbar {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #fed7aa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03);
  z-index: 10;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumb-prefix {
  color: #a8a29e;
  font-size: 0.85rem;
  font-weight: 500;
}

.breadcrumb-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1c1917;
  letter-spacing: -0.015em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.badge-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.badge-status.status-active {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.badge-status.status-active:hover {
  background: #d1fae5;
}

.badge-status.status-active .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.badge-status.status-active .status-text {
  color: #047857;
}

.badge-status.status-pending {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.badge-status.status-pending:hover {
  background: #fee2e2;
}

.badge-status.status-pending .status-dot {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.badge-status.status-pending .status-text {
  color: #b91c1c;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  animation: pulse-dot 2s infinite ease-in-out;
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.status-text {
  font-size: 0.775rem;
  font-weight: 700;
}

.datetime-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #fbfaf8;
  border: 1px solid #fed7aa;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
}

.datetime-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #57534e;
  text-transform: capitalize;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background: #f5f5f4;
}

.user-avatar {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #292524;
  line-height: 1.1;
}

.user-role {
  font-size: 0.65rem;
  font-weight: 600;
  color: #78716c;
  line-height: 1.1;
}

.content-body {
  flex: 1;
  padding: 1.75rem 2rem;
  overflow-y: auto;
  background-color: #fafaf9;
}

/* Transición suave entre páginas */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>