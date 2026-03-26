<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
</script>

<template>
  <div class="flex h-screen bg-bg text-text">
    <AppSidebar />
    <main class="flex-1 overflow-auto p-8">
      <router-view />
    </main>
  </div>
</template>