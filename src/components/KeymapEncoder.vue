<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ccwLabel: string
  swLabel: string
  cwLabel: string
  expanded?: boolean
  selectedAction?: 'ccw' | 'sw' | 'cw' | null
  cellSize: number
}>()

const emit = defineEmits<{
  select: [action: 'ccw' | 'sw' | 'cw']
  toggleExpand: []
}>()

function actionClass(action: 'ccw' | 'sw' | 'cw') {
  return props.selectedAction === action
    ? 'border-accent bg-accent/20 text-accent'
    : 'border-border bg-surface-raised text-text-light hover:border-text-muted'
}

// Popup dimensions are derived from the parent grid's cell size so they
// scale proportionally on resize. The parent (KeymapPage) uses the same
// POPUP_SCALE constant to calculate overflow padding.
const POPUP_SCALE = 0.6 // popup buttons = 60% of a grid cell
const popupBtnSize = computed(() => `${props.cellSize * POPUP_SCALE}px`)
const popupGap = computed(() => `${props.cellSize * POPUP_SCALE * 0.06}px`)
const popupPad = computed(() => `${props.cellSize * POPUP_SCALE * 0.08}px`)
</script>

<template>
  <div class="relative flex aspect-square w-full items-center justify-center">
    <!-- Circle button -->
    <button
      class="flex h-[85%] w-[85%] items-center justify-center rounded-full border font-medium transition-colors"
      :class="
        expanded
          ? 'border-accent bg-accent/20 text-accent'
          : 'border-border bg-surface-raised text-text-light hover:border-text-muted'
      "
      @click="emit('toggleExpand')"
    >
      <!-- Collapsed: show assigned actions so user can see binds even when collapsed -->
      <div class="flex flex-col items-center leading-tight">
        <span class="opacity-60">{{ ccwLabel }}</span>
        <span>{{ swLabel }}</span>
        <span class="opacity-60">{{ cwLabel }}</span>
      </div>
    </button>

    <!-- Expanded: 3 action keys floating above, each sized to 1 grid cell -->
    <div
      v-if="expanded"
      class="absolute bottom-full left-1/2 z-10 mb-[8%] flex -translate-x-1/2 items-center rounded-lg border border-border bg-surface"
      :style="{ gap: popupGap, padding: popupPad }"
    >
      <button
        class="flex aspect-square items-center justify-center rounded-lg border font-medium transition-colors"
        :style="{ width: popupBtnSize }"
        :class="actionClass('ccw')"
        @click="emit('select', 'ccw')"
      >
        {{ ccwLabel }}
      </button>
      <button
        class="flex aspect-square items-center justify-center rounded-full border font-medium transition-colors"
        :style="{ width: popupBtnSize }"
        :class="actionClass('sw')"
        @click="emit('select', 'sw')"
      >
        {{ swLabel }}
      </button>
      <button
        class="flex aspect-square items-center justify-center rounded-lg border font-medium transition-colors"
        :style="{ width: popupBtnSize }"
        :class="actionClass('cw')"
        @click="emit('select', 'cw')"
      >
        {{ cwLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
button {
  font-size: clamp(0.5rem, 4cqi, 1rem);
}
</style>