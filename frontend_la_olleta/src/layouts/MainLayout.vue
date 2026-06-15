<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>

<template>
  <div
    style="
      display: flex;
      min-height: 100vh;
      background-color: #f8fafc;
      font-family: 'Inter', sans-serif;
    "
  >
    <Sidebar />

    <main
      style="
        flex: 1;
        padding: 2rem;
        overflow-y: auto;
        height: 100vh;
      "
    >
      <RouterView />
    </main>
  </div>
</template>