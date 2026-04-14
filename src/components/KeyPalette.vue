<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { KEYCODE_CATEGORIES, type Keycode } from '@/keycodes'

const emit = defineEmits<{
  assign: [keycode: number]
}>()

const activeCategory = ref('basic')
const search = ref('')

const visibleCategories = computed(() => {
  if (!search.value) return KEYCODE_CATEGORIES
  const q = search.value.toLowerCase()
  return KEYCODE_CATEGORIES.filter((c) => c.keys.some((k) => k.label.toLowerCase().includes(q)))
})

// When a search query hides the currently active tab (no keys match),
// fall back to the first tab that still has matching keys.
const effectiveCategory = computed(() => {
  const visible = visibleCategories.value
  if (visible.some((c) => c.id === activeCategory.value)) return activeCategory.value
  return visible[0]?.id ?? 'basic'
})

const activeKeys = computed((): Keycode[] => {
  const category = KEYCODE_CATEGORIES.find((c) => c.id === effectiveCategory.value)
  if (!category) return []
  if (!search.value) return category.keys
  const q = search.value.toLowerCase()
  return category.keys.filter((k) => k.label.toLowerCase().includes(q))
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <!-- Tabs + search -->
    <div class="flex items-center justify-between">
      <div class="flex gap-1">
        <button
          v-for="cat in visibleCategories"
          :key="cat.id"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            effectiveCategory === cat.id
              ? 'text-text-heading border-b-2 border-accent'
              : 'text-text-muted hover:text-text-light'
          "
          @click="activeCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5">
        <Search :size="14" class="text-text-muted" />
        <input
          v-model="search"
          type="text"
          placeholder="Search any codes..."
          class="bg-transparent text-sm text-text-light placeholder:text-text-muted outline-none"
        />
        <button v-if="search" class="text-text-muted hover:text-text-light" @click="search = ''">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Keys grid -->
    <div class="scrollbar-thin grid min-h-0 flex-1 content-start gap-2 overflow-y-auto" style="grid-template-columns: repeat(auto-fill, 3.5rem)">
      <button
        v-for="kc in activeKeys"
        :key="kc.code"
        class="flex aspect-square items-center justify-center rounded-lg border border-border bg-surface-raised text-xs font-medium text-text-light transition-colors hover:border-text-muted"
        :title="`0x${kc.code.toString(16).padStart(2, '0').toUpperCase()}`"
        @click="emit('assign', kc.code)"
      >
        {{ kc.label }}
      </button>
    </div>
  </div>
</template>