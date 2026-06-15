<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>

<template>
  <div
    style="
      display: flex;
      min-height: 100vh;
    "
  >
    <Sidebar />

    <main
      style="
        flex: 1;
        padding: 1rem;
      "
    >
      <RouterView />
    </main>
  </div>
</template>