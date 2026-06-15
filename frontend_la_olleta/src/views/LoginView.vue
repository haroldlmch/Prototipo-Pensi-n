<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';

import api from '../api/axios';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const nombreUsuario = ref('');
const contrasena = ref('');

const cargando = ref(false);
const error = ref('');

const login = async () => {
  try {
    cargando.value = true;
    error.value = '';

    const response = await api.post('/auth/login', {
      nombreUsuario: nombreUsuario.value,
      contrasena: contrasena.value,
    });

    authStore.setToken(
      response.data.access_token,
    );

    router.push('/dashboard');

  } catch (err) {

    error.value =
      'Usuario o contraseña incorrectos';

  } finally {

    cargando.value = false;

  }
};
</script>

<template>
  <div
    style="
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    "
  >
    <div
      style="
        width: 350px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      "
    >
      <h2>La O'lleta</h2>

      <InputText
        v-model="nombreUsuario"
        placeholder="Usuario"
      />

      <Password
        v-model="contrasena"
        placeholder="Contraseña"
        :feedback="false"
      />

      <Button
        label="Iniciar sesión"
        :loading="cargando"
        @click="login"
      />

      <small
        v-if="error"
        style="color: red;"
      >
        {{ error }}
      </small>
    </div>
  </div>
</template>