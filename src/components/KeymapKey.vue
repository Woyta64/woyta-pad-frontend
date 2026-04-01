<script setup lang="ts">
defineProps<{
  label: string
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    class="flex aspect-square w-full items-center justify-center rounded-lg border font-medium transition-colors"
    :class="
      selected
        ? 'border-accent bg-accent/20 text-accent'
        : 'border-border bg-surface-raised text-text-light hover:border-text-muted'
    "
    @click="emit('select')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
button {
  font-size: clamp(0.5rem, 4cqi, 1.25rem);
}
</style>