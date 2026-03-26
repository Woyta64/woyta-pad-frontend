<script setup lang="ts">
import { Keyboard, Zap, Download, Settings, HelpCircle } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

function disconnect() {
  router.push('/')
}

const topNavItems = [
  { id: 'keymap', label: 'Keymap', icon: Keyboard, to: '/keymap' },
  { id: 'macros', label: 'Macros', icon: Zap, to: '/macro' },
]

const bottomNavItems = [
  { id: 'firmware', label: 'Firmware Update', icon: Download, to: '/firmware' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/settings' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, to: '/help' },
]
</script>

<template>
  <aside class="flex w-60 flex-col border-r border-border bg-surface">
    <!-- Header -->
    <div class="p-5 pb-6">
      <h1 class="text-lg font-semibold text-text-heading">Woyta Pad Launcher</h1>
    </div>

    <!-- Device card -->
    <div class="mx-4 rounded-lg bg-surface-raised p-5">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent">
          <Keyboard :size="20" />
        </div>
        <div>
          <div class="text-sm font-medium text-text-heading">MacroPad v2</div>
          <div class="text-xs text-text-muted">Connected: USB-C</div>
        </div>
      </div>
    </div>

    <!-- Connect button -->
    <div class="px-4 pt-3">
      <button
        class="w-full rounded-lg bg-error py-3 text-sm font-medium text-bg transition-colors hover:bg-error-hover"
        @click="disconnect"
      >
        Disconnect Device
      </button>
    </div>

    <!-- Navigation -->
    <nav class="mt-8 flex-1 px-3">
      <ul class="space-y-1.5">
        <li v-for="item in topNavItems" :key="item.id">
          <router-link
            :to="item.to"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors"
            :class="
              route.path === item.to
                ? 'bg-accent/10 text-accent border-l-2 border-accent'
                : 'text-text-muted hover:text-text-light hover:bg-text-heading/5'
            "
          >
            <component :is="item.icon" :size="18" />
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Bottom nav -->
    <nav class="px-3 pb-5">
      <ul class="space-y-1.5">
        <li v-for="item in bottomNavItems" :key="item.id">
          <router-link
            :to="item.to"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-text-muted transition-colors hover:text-text-light hover:bg-text-heading/5"
          >
            <component :is="item.icon" :size="18" />
            {{ item.label }}
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>