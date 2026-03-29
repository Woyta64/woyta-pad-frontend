<script setup lang="ts">
import { Keyboard } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'

const router = useRouter()
const deviceStore = useDeviceStore()

const hidSupported = 'hid' in navigator

async function connectDevice() {
  try {
    await deviceStore.connect()
    if (deviceStore.isConnected) router.push('/keymap')
  } catch {
    // error is hopefully already captured in the store
  }
}

function tryWithoutDevice() {
  deviceStore.enterDemoMode()
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

      <p v-if="!hidSupported" class="text-sm text-error">
        WebHID is not supported in this browser. Use Chrome or Edge.
      </p>
      <p v-if="deviceStore.error" class="text-sm text-error">
        {{ deviceStore.error }}
      </p>

      <button
        :disabled="!hidSupported"
        class="mt-4 rounded-lg bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
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