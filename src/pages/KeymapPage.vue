<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted, onUnmounted } from 'vue'
import { Save } from 'lucide-vue-next'
import KeymapKey from '@/components/KeymapKey.vue'
import KeymapEncoder from '@/components/KeymapEncoder.vue'
import KeyPalette from '@/components/KeyPalette.vue'
import * as KC from '@/keycodes'
import { keycodeLabel } from '@/keycodes'

const NUM_LAYERS = 4
const activeLayer = ref(0)
const layers = Array.from({ length: NUM_LAYERS }, (_, i) => i)

// --- Layout definition (will come from hardware) ---

// Physical layout: defines grid structure (same across all layers)
type PhysicalKey = { type: 'key' }
type PhysicalEncoder = { type: 'encoder'; id: number }
type PhysicalEmpty = { type: 'empty' }
type PhysicalCell = PhysicalKey | PhysicalEncoder | PhysicalEmpty

const physicalLayout: PhysicalCell[][] = [
  [{ type: 'encoder', id: 0 }, { type: 'encoder', id: 1 }, { type: 'empty' }],
  [{ type: 'key' }, { type: 'key' }, { type: 'key' }],
  [{ type: 'key' }, { type: 'key' }, { type: 'key' }],
  [{ type: 'key' }, { type: 'key' }, { type: 'key' }],
]

// Keymap: keycodes per layer, indexed as keymap[layer][row][col]
// For encoder cells the value is ignored (encoders use encoderMap)
const keymap = ref<number[][][]>([
  // Layer 0
  [
    [0, 0, 0], // encoder row (unused here)
    [KC.KC_ESC.code, KC.KC_Q.code, KC.KC_F1.code],
    [KC.KC_TAB.code, KC.KC_A.code, KC.KC_F2.code],
    [KC.KC_LEFTSHIFT.code, KC.KC_Z.code, KC.KC_F3.code],
  ],
  // Layer 1
  [
    [0, 0, 0],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code]
  ],
  // Layer 2
  [
    [0, 0, 0],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code]
  ],
  // Layer 3
  [
    [0, 0, 0],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code],
    [KC.KC_TRNS.code, KC.KC_TRNS.code, KC.KC_TRNS.code]
  ],
])

// Encoder keycodes per layer: encoderMap[layer][encoderId] = { ccw, sw, cw }
const encoderMap = ref<{ ccw: number; sw: number; cw: number }[][]>([
  // Layer 0
  [
    { ccw: KC.KC_MEDIA_VOLUMEDOWN.code, sw: KC.KC_MEDIA_MUTE.code, cw: KC.KC_MEDIA_VOLUMEUP.code },
    { ccw: KC.KC_MEDIA_PREVIOUSSONG.code, sw: KC.KC_MEDIA_PLAYPAUSE.code, cw: KC.KC_MEDIA_NEXTSONG.code },
  ],
  // Layer 1
  [
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
  ],
  // Layer 2
  [
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
  ],
  // Layer 3
  [
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
    { ccw: KC.KC_TRNS.code, sw: KC.KC_TRNS.code, cw: KC.KC_TRNS.code },
  ],
])

console.log('Keymap loaded:', JSON.parse(JSON.stringify(keymap.value)))
console.log('Encoder map loaded:', JSON.parse(JSON.stringify(encoderMap.value)))

const cols = physicalLayout[0].length
const rows = physicalLayout.length

// Does row 0 contain any encoder? If yes, reserve space above for popup
const hasTopEncoders = computed(() =>
  physicalLayout[0].some((cell) => cell.type === 'encoder'),
)

function switchLayer(layer: number) {
  console.log(`Switching to layer ${layer + 1}(index: ${layer})`)
  activeLayer.value = layer
  selection.value = null
  expandedEncoder.value = null
}

// --- Accessors for active layer ---

function keyAt(row: number, col: number): number {
  return keymap.value[activeLayer.value][row][col]
}

function encoderAt(id: number): { ccw: number; sw: number; cw: number } {
  return encoderMap.value[activeLayer.value][id]
}

const gridStyle = {
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gridTemplateRows: `repeat(${rows}, 1fr)`,
  aspectRatio: `${cols} / ${rows}`,
}

// Track cell size via ResizeObserver so encoder popup buttons can be sized
// proportionally to the grid cells (they float outside the grid flow).
const gridEl = useTemplateRef<HTMLElement>('grid')
const cellSize = ref(0)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (!gridEl.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    // Subtract inter-cell gaps to get the actual width of a single cell
    const gap = parseFloat(getComputedStyle(entry.target).columnGap) || 0
    cellSize.value = (entry.contentRect.width - gap * (cols - 1)) / cols
  })
  resizeObserver.observe(gridEl.value)
})

onUnmounted(() => resizeObserver?.disconnect())

// Must match POPUP_SCALE in KeymapEncoder.vue.
// When encoders sit in the top row, their expanded popup floats above
// the grid. This computed reserves enough vertical padding so the popup
// doesn't get clipped by the overflow-hidden container.
const POPUP_SCALE = 0.6
const popupReserve = computed(() => {
  if (!hasTopEncoders.value || cellSize.value === 0) return '0px'
  const btn = cellSize.value * POPUP_SCALE
  const pad = btn * 0.08
  const mb = cellSize.value * 0.08
  const total = btn + 2 * pad + mb
  return `${total * 0.6}px`
})

// --- Selection state ---

type EncoderAction = 'ccw' | 'sw' | 'cw'

interface KeySelection {
  type: 'key'
  row: number
  col: number
}

interface EncoderSelection {
  type: 'encoder'
  id: number
  action: EncoderAction
}

type Selection = KeySelection | EncoderSelection

const selection = ref<Selection | null>(null)
const expandedEncoder = ref<number | null>(null)

function selectKey(row: number, col: number) {
  expandedEncoder.value = null
  selection.value = { type: 'key', row, col }
}

// Clicking an already-expanded encoder collapses it and clears selection.
// Clicking a different encoder expands it and auto-selects its CCW action.
function toggleEncoder(id: number) {
  if (expandedEncoder.value === id) {
    expandedEncoder.value = null
    selection.value = null
  } else {
    expandedEncoder.value = id
    selection.value = { type: 'encoder', id, action: 'ccw' }
  }
}

function selectEncoderAction(id: number, action: EncoderAction) {
  selection.value = { type: 'encoder', id, action }
}

function isKeySelected(row: number, col: number) {
  return selection.value?.type === 'key' && selection.value.row === row && selection.value.col === col
}

function encoderSelectedAction(id: number): EncoderAction | null {
  if (selection.value?.type === 'encoder' && selection.value.id === id) {
    return selection.value.action
  }
  return null
}

function assignFromPalette(code: number) {
  const selected = selection.value
  if (!selected) return

  const layer = activeLayer.value

  if (selected.type === 'key') {
    console.log(`Assigning keycode 0x${code.toString(16)} to key [layer=${layer}, row=${selected.row}, col=${selected.col}]`)
    keymap.value[layer][selected.row][selected.col] = code
  } else if (selected.type === 'encoder') {
    console.log(`Assigning keycode 0x${code.toString(16)} to encoder ${selected.id} ${selected.action} [layer=${layer}]`)
    const encoder = encoderMap.value[layer][selected.id]
    encoder[selected.action] = code
  }
}

function saveChanges() {
  console.log('Saving keymap:', JSON.parse(JSON.stringify(keymap.value)))
  console.log('Saving encoder map:', JSON.parse(JSON.stringify(encoderMap.value)))
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-border px-6 py-4">
      <p class="text-sm text-text-muted">Configure Woyta Pad layer configuration</p>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-text-muted">LAYERS</span>
          <div class="flex gap-1">
            <button
              v-for="layer in layers"
              :key="layer"
              class="flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors"
              :class="
                activeLayer === layer
                  ? 'bg-accent text-bg'
                  : 'border border-border text-text-muted hover:border-text-muted'
              "
              @click="switchLayer(layer)"
            >
              {{ layer + 1 }}
            </button>
          </div>
        </div>

        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
          @click="saveChanges"
        >
          <Save :size="16" />
          Save Changes
        </button>
      </div>
    </header>

    <!-- Keymap area -->
    <div class="flex basis-3/5 items-center justify-center overflow-hidden p-4">
      <div
        class="flex h-[80%] items-center"
        :style="{ paddingTop: popupReserve, paddingBottom: popupReserve }"
      >
        <div
          ref="grid"
          class="@container grid h-full gap-[3%]"
          :style="gridStyle"
        >
          <template v-for="(row, ri) in physicalLayout" :key="ri">
            <template v-for="(cell, ci) in row" :key="ci">
              <KeymapKey
                v-if="cell.type === 'key'"
                :label="keycodeLabel(keyAt(ri, ci))"
                :selected="isKeySelected(ri, ci)"
                @select="selectKey(ri, ci)"
              />
              <KeymapEncoder
                v-else-if="cell.type === 'encoder'"
                :ccw-label="keycodeLabel(encoderAt(cell.id).ccw)"
                :sw-label="keycodeLabel(encoderAt(cell.id).sw)"
                :cw-label="keycodeLabel(encoderAt(cell.id).cw)"
                :expanded="expandedEncoder === cell.id"
                :selected-action="encoderSelectedAction(cell.id)"
                :cell-size="cellSize"
                @toggle-expand="toggleEncoder(cell.id)"
                @select="selectEncoderAction(cell.id, $event)"
              />
              <!-- Empty cell to keep correct grid alignment -->
              <div v-else />
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- Key palette -->
    <div class="flex min-h-0 flex-1 flex-col border-t border-border px-6 py-4">
      <KeyPalette @assign="assignFromPalette" />
    </div>
  </div>
</template>