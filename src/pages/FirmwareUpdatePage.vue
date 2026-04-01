<script setup lang="ts">
import { Download, Info } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <h2 class="text-lg font-semibold text-text-heading">Firmware Update</h2>

    <!-- Current firmware info -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Info :size="16" />
        Current Firmware
      </div>
      <div class="rounded-lg border border-border bg-surface-raised p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-light">Version</p>
            <p class="text-xs text-text-muted">Unknown</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download button -->
    <section class="flex flex-col gap-3">
      <button
        disabled
        class="flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-raised px-5 py-3 text-sm font-medium text-text-muted transition-colors"
      >
        <Download :size="16" />
        Download Latest Firmware
      </button>
      <p class="text-xs text-text-muted">Firmware flashing is not yet implemented.</p>
    </section>
  </div>
</template>