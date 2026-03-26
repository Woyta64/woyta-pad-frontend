<script setup lang="ts">
import { Keyboard } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

async function connectDevice() {
  // TODO: WebHID connection logic
  router.push('/keymap')
}

function tryWithoutDevice() {
  router.push('/keymap')
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-bg text-text">
    <div class="flex flex-col items-center gap-6">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Keyboard :size="40" />
      </div>
      <h1 class="text-3xl font-semibold text-text-heading">Woyta-Pad Launcher</h1>
      <p class="text-text-muted">Connect your Woyta-Pad to get started</p>
      <button
        class="mt-4 rounded-lg bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent-hover"
        @click="connectDevice"
      >
        Connect Device
      </button>
      <button
          class="mt-4 rounded-lg bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent-hover"
          @click="tryWithoutDevice"
      >
        Try without device
      </button>
    </div>
  </div>
</template>