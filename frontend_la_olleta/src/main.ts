import { createApp } from 'vue';
import { createPinia } from 'pinia';

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

import App from './App.vue';
import router from './router';

import 'primeicons/primeicons.css';
import './assets/global.css';

const app = createApp(App);

app.use(createPinia());

app.use(router);

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      // Deshabilitar completamente el modo oscuro automático.
      // Así PrimeVue siempre usará el tema claro sin importar
      // la configuración del sistema operativo del usuario.
      darkModeSelector: false,
    },
  },
});

app.mount('#app');
