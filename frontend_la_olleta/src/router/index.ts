import { createRouter, createWebHistory } from 'vue-router';

import MainLayout from '../layouts/MainLayout.vue';

import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import PensionadosView from '../views/PensionadosView.vue';
import MenusView from '../views/MenusView.vue';
import PensionesView from '../views/PensionesView.vue';
import ConsumosView from '../views/ConsumosView.vue';
import PagosView from '../views/PagosView.vue';
import ExtrasView from '../views/ExtrasView.vue';
import VentasCasualesView from '../views/VentasCasualesView.vue';
import OpcionesMenuView from '@/views/OpcionesMenuView.vue';
import ConfiguracionView from '../views/ConfiguracionView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },

    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'pensionados',
          name: 'pensionados',
          component: PensionadosView,
        },
        {
          path: 'menus',
          name: 'menus',
          component: MenusView,
        },
        {
          path: 'opciones-menu',
          redirect: '/menus',
        },
        {
          path: 'pensiones',
          name: 'pensiones',
          component: PensionesView,
        },
        {
          path: 'consumos',
          name: 'consumos',
          component: ConsumosView,
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: PagosView,
        },
        {
          path: 'extras',
          name: 'extras',
          component: ExtrasView,
        },
        {
          path: 'ventas-casuales',
          name: 'ventas-casuales',
          component: VentasCasualesView,
        },
        {
          path: 'configuracion',
          name: 'configuracion',
          component: ConfiguracionView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isPublic = to.matched.some((record) => record.meta.public);

  if (!isPublic && !token) {
    next({ name: 'login' });
  } else if (to.name === 'login' && token) {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
