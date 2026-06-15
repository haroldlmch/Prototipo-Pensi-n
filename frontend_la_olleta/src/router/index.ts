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
      redirect: '/login',
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/',
      component: MainLayout,

      children: [
        {
          path: 'dashboard',
          component: DashboardView,
        },

        {
          path: 'pensionados',
          component: PensionadosView,
        },

        {
          path: 'menus',
          component: MenusView,
        },

        {
          path: 'pensiones',
          component: PensionesView,
        },

        {
          path: 'consumos',
          component: ConsumosView,
        },

        {
          path: 'pagos',
          component: PagosView,
        },

        {
  path: 'opciones-menu',
  component: OpcionesMenuView,
},

        {
          path: 'extras',
          component: ExtrasView,
        },

        {
          path: 'ventas-casuales',
          component: VentasCasualesView,
        },

        {
          path: 'configuracion',
          component: ConfiguracionView,
        },
      ],
    },
  ],
});

export default router;
