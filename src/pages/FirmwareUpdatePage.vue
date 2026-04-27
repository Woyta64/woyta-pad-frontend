<script setup lang="ts">
import {computed, ref} from 'vue'
import { Download, Info } from 'lucide-vue-next'
import { useDeviceStore } from '../stores/device'

const deviceStore = useDeviceStore()
const keyboardSlug = computed(() => deviceStore.metadata?.id ?? null)

const API_BASE = 'https://firmware.woyta.dev'
const downloading = ref(false)

function downloadFirmware() {
  if (downloading.value || !keyboardSlug.value) return
  downloading.value = true
  window.location.href = `${API_BASE}/api/download/${keyboardSlug.value}`
  setTimeout(() => { downloading.value = false }, 2000)
}
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <h2 class="text-lg font-semibold text-text-heading">{{ $t('firmware.title') }}</h2>

    <!-- Current firmware info -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Info :size="16" />
        {{ $t('firmware.currentFirmware') }}
      </div>
      <div class="rounded-lg border border-border bg-surface-raised p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-light">{{ $t('firmware.keyboard') }}</p>
            <p class="text-xs text-text-muted">{{ keyboardSlug ?? $t('firmware.notConnected') }}</p>
            <p class="mt-2 text-sm text-text-light">{{ $t('firmware.version') }}</p>
            <p class="text-xs text-text-muted">{{ $t('firmware.unknown') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download button -->
    <section class="flex flex-col gap-3">
      <button
          :disabled="downloading || !keyboardSlug"
          class="flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-raised px-5 py-3 text-sm font-medium transition-colors"
          :class="!downloading && keyboardSlug ? 'text-text-light hover:bg-surface-hover cursor-pointer' : 'text-text-muted cursor-not-allowed'"
          @click="downloadFirmware"
      >
        <Download :size="16" />
        {{ downloading ? $t('firmware.startingDownload') : $t('firmware.downloadLatest') }}
      </button>
      <p class="text-xs text-text-muted">
        {{ $t('firmware.flashInstructions', { file: '.uf2' }) }}
      </p>
    </section>
  </div>
</template>