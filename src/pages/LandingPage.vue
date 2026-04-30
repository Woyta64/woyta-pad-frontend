<script setup lang="ts">
import { ref, computed } from 'vue'
import { Keyboard, Copy, Check } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useDeviceStore } from '@/stores/device'

const router = useRouter()
const deviceStore = useDeviceStore()

const hidSupported = 'hid' in navigator
const isLinux = navigator.userAgent.includes('Linux') && !navigator.userAgent.includes('Android')

const showLinuxHint = computed(
  () => isLinux && !!deviceStore.error && /NotAllowedError|failed to open/i.test(deviceStore.error ?? '')
)

const UDEV_FILE_PATH = '/etc/udev/rules.d/99-woyta-pad.rules'
const UDEV_RULE = '# Woyta-Pad WebHID Access\nKERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="5750", MODE="0666"'
const UDEV_RELOAD_CMD = 'sudo udevadm control --reload-rules && sudo udevadm trigger'

const copiedKey = ref<string | null>(null)

async function copyText(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = null }, 1500)
}

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

      <div v-if="showLinuxHint" class="w-160 rounded-lg border border-border bg-surface-raised p-5 text-left">
        <p class="text-sm text-text-light leading-relaxed">{{ $t('landing.linuxPermissionHint') }}</p>
        <div class="relative mt-3">
          <pre class="overflow-x-auto rounded bg-surface px-4 py-3 pr-12 text-sm text-text-light">{{ UDEV_FILE_PATH }}</pre>
          <button
            class="absolute right-2 top-2 rounded p-1.5 text-text-muted transition-colors hover:bg-border hover:text-text-light"
            @click="copyText(UDEV_FILE_PATH, 'path')"
          >
            <Check v-if="copiedKey === 'path'" :size="14" />
            <Copy v-else :size="14" />
          </button>
        </div>
        <div class="relative mt-1">
          <pre class="overflow-x-auto rounded bg-surface px-4 py-3 pr-12 text-sm text-text-light">{{ UDEV_RULE }}</pre>
          <button
            class="absolute right-2 top-2 rounded p-1.5 text-text-muted transition-colors hover:bg-border hover:text-text-light"
            @click="copyText(UDEV_RULE, 'rule')"
          >
            <Check v-if="copiedKey === 'rule'" :size="14" />
            <Copy v-else :size="14" />
          </button>
        </div>
        <p class="mt-4 text-sm text-text-muted">{{ $t('landing.linuxUdevReload') }}</p>
        <div class="relative mt-1">
          <pre class="overflow-x-auto rounded bg-surface px-4 py-3 pr-12 text-sm text-text-light">{{ UDEV_RELOAD_CMD }}</pre>
          <button
            class="absolute right-2 top-2 rounded p-1.5 text-text-muted transition-colors hover:bg-border hover:text-text-light"
            @click="copyText(UDEV_RELOAD_CMD, 'reload')"
          >
            <Check v-if="copiedKey === 'reload'" :size="14" />
            <Copy v-else :size="14" />
          </button>
        </div>
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