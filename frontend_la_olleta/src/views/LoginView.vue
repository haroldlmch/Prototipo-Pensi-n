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
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      font-family: 'Inter', sans-serif;
    "
  >
    <div
      style="
        width: 400px;
        background: white;
        border-radius: 24px;
        padding: 2.5rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      "
    >
      <!-- Logo / Header -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <div
          style="
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
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
            margin: 0.5rem 0 0 0;
            color: #0f172a;
            font-size: 1.75rem;
            font-weight: 800;
            letter-spacing: -0.025em;
          "
        >
          La O'lleta
        </h2>
        <span style="color: #64748b; font-size: 0.9rem; font-weight: 500;">Sistema de Gestión de Pensiones</span>
      </div>

      <!-- Form Fields -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Usuario</label>
          <div class="p-input-icon-left" style="width: 100%;">
            <InputText
              v-model="nombreUsuario"
              placeholder="Ingrese su usuario"
              style="width: 100%; padding: 0.75rem 1rem;"
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-weight: 600; color: #475569; font-size: 0.85rem;">Contraseña</label>
          <Password
            v-model="contrasena"
            placeholder="Ingrese su contraseña"
            :feedback="false"
            toggleMask
            fluid
            style="width: 100%;"
            :inputStyle="{ width: '100%', padding: '0.75rem 1rem' }"
          />
        </div>
      </div>

      <!-- Action Button -->
      <Button
        label="Iniciar Sesión"
        :loading="cargando"
        style="
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border: none;
          padding: 0.85rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
          cursor: pointer;
        "
        @click="login"
      />

      <!-- Error Message -->
      <div
        v-if="error"
        style="
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        "
      >
        <i class="pi pi-exclamation-circle" style="font-size: 1rem;"></i>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>