<script setup lang="ts">
import { computed } from 'vue'
import { Keyboard } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'

const router = useRouter()
const deviceStore = useDeviceStore()

const hidSupported = 'hid' in navigator
const isLinux = navigator.userAgent.includes('Linux') && !navigator.userAgent.includes('Android')

const showLinuxHint = computed(() =>
  isLinux && !!deviceStore.error && /NotAllowedError|failed to open/i.test(deviceStore.error)
)

async function connectDevice() {
  try {
    await deviceStore.connect()
    if (deviceStore.isConnected) router.push('/keymap')
  } catch (error) {
    console.error('[woyta-pad] Connection failed:', error)
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
      <h1 class="text-3xl font-semibold text-text-heading">{{ $t('landing.title') }}</h1>
      <p class="text-text-muted">{{ $t('landing.subtitle') }}</p>

      <p v-if="!hidSupported" class="text-sm text-error">
        {{ $t('landing.webHidUnsupported') }}
      </p>
      <p v-if="deviceStore.error" class="text-sm text-error">
        {{ deviceStore.error }}
      </p>

      <div v-if="showLinuxHint" class="max-w-sm rounded-lg border border-border bg-surface-raised p-4 text-left">
        <p class="text-xs text-text-light leading-relaxed">{{ $t('landing.linuxPermissionHint') }}</p>
        <pre class="mt-2 rounded bg-surface p-2 text-xs text-text-light"># Woyta-Pad WebHID Access
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="cafe", ATTRS{idProduct}=="4243", MODE="0666"</pre>
        <p class="mt-2 text-xs text-text-muted">{{ $t('landing.linuxUdevReload') }}</p>
      </div>

      <button
        :disabled="!hidSupported"
        class="mt-4 rounded-lg bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        @click="connectDevice"
      >
        {{ $t('landing.connectDevice') }}
      </button>
      <button
        class="mt-4 rounded-lg bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent-hover"
        @click="tryWithoutDevice"
      >
        {{ $t('landing.tryWithoutDevice') }}
      </button>
    </div>
  </div>
</template>