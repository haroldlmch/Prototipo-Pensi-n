/// <reference types="vite/client" />

// Le dice a TypeScript que los archivos *.vue son componentes Vue válidos.
// Sin esto, TS no puede resolver imports como `import App from './App.vue'`.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<object, object, any>;
  export default component;
}
