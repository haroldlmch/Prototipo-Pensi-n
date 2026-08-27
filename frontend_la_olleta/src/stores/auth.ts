import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: sessionStorage.getItem('token') || '',
  }),

  actions: {
    setToken(token: string) {
      this.token = token;
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token'); // Limpiar token persistente anterior
    },

    logout() {
      this.token = '';
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    },
  },
});