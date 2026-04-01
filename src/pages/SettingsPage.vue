<script setup lang="ts">
import { ref } from 'vue'
import { Globe, ScrollText } from 'lucide-vue-next'

const selectedLanguage = ref('en')

const languages = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' },
  { code: 'jp', label: 'Japan' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ko', label: 'Korean'}
]
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <h2 class="text-lg font-semibold text-text-heading">Settings</h2>

    <!-- Language -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Globe :size="16" />
        Language
      </div>
      <select
        v-model="selectedLanguage"
        disabled
        class="w-48 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted outline-none"
      >
        <option
          v-for="language in languages"
          :key="language.code"
          :value="language.code"
        >
          {{ language.label }}
        </option>
      </select>
      <p class="text-xs text-text-muted">Language support coming soon.</p>
    </section>

    <!-- Logs -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <ScrollText :size="16" />
        Device Logs
      </div>
      <div class="h-48 rounded-lg border border-border bg-surface-raised p-4">
        <p class="text-xs text-text-muted">No logs available yet.</p>
      </div>
    </section>
  </div>
</template>