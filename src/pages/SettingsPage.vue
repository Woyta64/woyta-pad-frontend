<script setup lang="ts">
import { watch } from 'vue'
import { Globe, ScrollText, Keyboard, Sun, Moon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { KEYBOARD_LAYOUTS, LAYOUT_STORAGE_KEY, DEFAULT_LAYOUT_ID } from '@/keyboardLayouts'
import { LOCALE_STORAGE_KEY } from '@/i18n'

const { t, locale } = useI18n()

const THEME_STORAGE_KEY = 'woyta-pad-theme'

import { ref } from 'vue'

const isLightTheme = ref(document.documentElement.classList.contains('light'))

function toggleTheme() {
  isLightTheme.value = !isLightTheme.value
  if (isLightTheme.value) {
    document.documentElement.classList.add('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
  } else {
    document.documentElement.classList.remove('light')
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
  }
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

watch(locale, (newLocale) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
})

const selectedLayoutId = ref(localStorage.getItem(LAYOUT_STORAGE_KEY) ?? DEFAULT_LAYOUT_ID)

function onLayoutChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  selectedLayoutId.value = value
  localStorage.setItem(LAYOUT_STORAGE_KEY, value)
}
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <h2 class="text-lg font-semibold text-text-heading">{{ t('settings.title') }}</h2>

    <!-- Theme -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Sun v-if="isLightTheme" :size="16" />
        <Moon v-else :size="16" />
        {{ t('settings.theme') }}
      </div>
      <div class="flex items-center gap-3">
        <button
          class="relative h-7 w-12 rounded-full transition-colors"
          :class="isLightTheme ? 'bg-accent' : 'bg-border'"
          @click="toggleTheme"
        >
          <span
            class="absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-text-heading transition-transform"
            :class="isLightTheme ? 'translate-x-5' : 'translate-x-0'"
          >
            <Sun v-if="isLightTheme" :size="12" class="text-bg" />
            <Moon v-else :size="12" class="text-bg" />
          </span>
        </button>
        <span class="text-sm text-text-muted">{{ isLightTheme ? t('settings.light') : t('settings.dark') }}</span>
      </div>
    </section>

    <!-- Language -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Globe :size="16" />
        {{ t('settings.language') }}
      </div>
      <select
        v-model="locale"
        class="w-48 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-light outline-none"
      >
        <option
          v-for="language in languages"
          :key="language.code"
          :value="language.code"
        >
          {{ language.label }}
        </option>
      </select>

    </section>

    <!-- Keyboard Layout -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <Keyboard :size="16" />
        {{ t('settings.keyboardLayout') }}
      </div>
      <select
        :value="selectedLayoutId"
        class="w-48 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-light outline-none focus:ring-1 focus:ring-accent"
        @change="onLayoutChange"
      >
        <option
          v-for="layout in KEYBOARD_LAYOUTS"
          :key="layout.id"
          :value="layout.id"
        >
          {{ layout.label }}
        </option>
      </select>
      <p class="text-xs text-text-muted">{{ t('settings.keyboardLayoutHint') }}</p>
    </section>

    <!-- Logs -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <ScrollText :size="16" />
        {{ t('settings.deviceLogs') }}
      </div>
      <div class="h-48 rounded-lg border border-border bg-surface-raised p-4">
        <p class="text-xs text-text-muted">{{ t('settings.noLogs') }}</p>
      </div>
    </section>
  </div>
</template>