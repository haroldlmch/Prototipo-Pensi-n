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
  if (!nombreUsuario.value || !contrasena.value) {
    error.value = 'Por favor ingrese su usuario y contraseña';
    return;
  }

  try {
    cargando.value = true;
    error.value = '';

    const response = await api.post('/auth/login', {
      nombreUsuario: nombreUsuario.value,
      contrasena: contrasena.value,
    });

    authStore.setToken(response.data.access_token);
    router.push('/dashboard');
  } catch (err) {
    error.value = 'Usuario o contraseña incorrectos';
  } finally {
    cargando.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper">
    <!-- Ambient glowing shapes in background -->
    <div class="glow-shape glow-1"></div>
    <div class="glow-shape glow-2"></div>

    <div class="login-card">
      <!-- Logo / Header -->
      <div class="login-header">
        <div class="brand-logo">
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
        <h1 class="brand-title">La O'lleta</h1>
        <div class="badge-role">Acceso Administrativo</div>
        <p class="brand-subtitle">Control de Pensiones & Restaurante</p>
      </div>

      <!-- Form Fields -->
      <form class="login-form" @submit.prevent="login">
        <div class="form-group">
          <label class="form-label">Nombre de Usuario</label>
          <div class="input-container">
            <i class="pi pi-user input-icon"></i>
            <InputText
              v-model="nombreUsuario"
              placeholder="Ingrese su usuario"
              class="custom-input"
              autofocus
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Contraseña</label>
          <div class="input-container">
            <i class="pi pi-lock input-icon"></i>
            <Password
              v-model="contrasena"
              placeholder="Ingrese su contraseña"
              :feedback="false"
              toggleMask
              fluid
              class="custom-password"
            />
          </div>
        </div>

        <!-- Action Button -->
        <Button
          type="submit"
          label="Ingresar al Sistema"
          icon="pi pi-sign-in"
          :loading="cargando"
          class="btn-login"
        />

        <!-- Error Message -->
        <div v-if="error" class="error-box">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ error }}</span>
        </div>
      </form>

      <!-- Footer Info -->
      <div class="login-footer">
        <i class="pi pi-shield" style="font-size: 0.75rem;"></i>
        <span>Plataforma Segura · Versión Monografía 2026</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1c1917; /* Stone 900 */
  position: relative;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 1.5rem;
}

/* Ambient glow */
.glow-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  opacity: 0.25;
}

.glow-1 {
  width: 450px;
  height: 450px;
  background: #ea580c;
  top: -100px;
  right: -100px;
}

.glow-2 {
  width: 400px;
  height: 400px;
  background: #d97706;
  bottom: -100px;
  left: -100px;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 2.75rem 2.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-logo {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.45);
  margin-bottom: 0.85rem;
}

.brand-title {
  margin: 0;
  color: #1c1917;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.badge-role {
  margin-top: 0.35rem;
  display: inline-block;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.brand-subtitle {
  margin: 0.5rem 0 0 0;
  color: #78716c;
  font-size: 0.875rem;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-weight: 700;
  color: #44403c;
  font-size: 0.8rem;
  letter-spacing: -0.01em;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #a8a29e;
  font-size: 0.95rem;
  z-index: 3;
}

.custom-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.6rem !important;
  border-radius: 12px !important;
  border: 1px solid #d6d3d1 !important;
  font-size: 0.9rem !important;
}

.custom-input:focus {
  border-color: #ea580c !important;
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15) !important;
}

:deep(.custom-password input) {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.6rem !important;
  border-radius: 12px !important;
  border: 1px solid #d6d3d1 !important;
  font-size: 0.9rem !important;
}

:deep(.custom-password input:focus) {
  border-color: #ea580c !important;
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15) !important;
}

.btn-login {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  border: none !important;
  padding: 0.85rem !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  color: #ffffff !important;
  box-shadow: 0 6px 16px -2px rgba(234, 88, 12, 0.4) !important;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: all 0.2s ease !important;
}

.btn-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px -3px rgba(234, 88, 12, 0.5) !important;
}

.btn-login:active {
  transform: translateY(0);
}

.error-box {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  color: #a8a29e;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}
</style>