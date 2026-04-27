<script setup lang="ts">
import { ref, computed, watch, useTemplateRef, onMounted, onUnmounted } from 'vue'
import { Save, Loader2 } from 'lucide-vue-next'
import KeymapKey from '@/components/KeymapKey.vue'
import KeymapEncoder from '@/components/KeymapEncoder.vue'
import KeyPalette from '@/components/KeyPalette.vue'
import { keycodeLabel } from '@/keycodes'
import {
  useDeviceStore,
  type LayoutItem,
  type EncoderActions,
  type EncoderActionName,
} from '@/stores/device'

// --- Types ---

type PhysicalKey = { type: 'key'; matrixRow: number; matrixCol: number }
type PhysicalEncoder = { type: 'encoder'; encoderIndex: number }
type PhysicalEmpty = { type: 'empty' }
type PhysicalCell = PhysicalKey | PhysicalEncoder | PhysicalEmpty

interface MatrixDimensions {
  layers: number
  rows: number
  cols: number
  encoders: number
}

interface KeySelection {
  type: 'key'
  matrixRow: number
  matrixCol: number
}

interface EncoderSelection {
  type: 'encoder'
  encoderIndex: number
  action: EncoderActionName
}

type Selection = KeySelection | EncoderSelection

// --- Pure helpers (no reactive dependencies) ---

const DEMO_DEFAULTS: MatrixDimensions = { layers: 4, rows: 4, cols: 3, encoders: 2 }

function createEmptyKeymapGrid(dimensions: MatrixDimensions): number[][][] {
  return Array.from({ length: dimensions.layers }, () =>
    Array.from({ length: dimensions.rows }, () => Array<number>(dimensions.cols).fill(0)),
  )
}

function createEmptyEncoderGrid(dimensions: MatrixDimensions): EncoderActions[][] {
  return Array.from({ length: dimensions.layers }, () =>
    Array.from({ length: dimensions.encoders }, () => ({ ccw: 0, sw: 0, cw: 0 })),
  )
}

function createDemoLayout(): PhysicalCell[][] {
  return [
    [{ type: 'encoder', encoderIndex: 0 }, { type: 'encoder', encoderIndex: 1 }, { type: 'empty' }],
    [{ type: 'key', matrixRow: 1, matrixCol: 0 }, { type: 'key', matrixRow: 1, matrixCol: 1 }, { type: 'key', matrixRow: 1, matrixCol: 2 }],
    [{ type: 'key', matrixRow: 2, matrixCol: 0 }, { type: 'key', matrixRow: 2, matrixCol: 1 }, { type: 'key', matrixRow: 2, matrixCol: 2 }],
    [{ type: 'key', matrixRow: 3, matrixCol: 0 }, { type: 'key', matrixRow: 3, matrixCol: 1 }, { type: 'key', matrixRow: 3, matrixCol: 2 }],
  ]
}

// Converts flat layout items into a 2D grid using each item's x/y as grid coordinates.
// For keys, matrixRow/matrixCol map to the keymap array.
// For encoders, matrixRow is the encoder index.
function buildPhysicalLayout(items: LayoutItem[]): PhysicalCell[][] {
  let maxCol = 0
  let maxRow = 0
  for (const item of items) {
    maxCol = Math.max(maxCol, item.x + 1)
    maxRow = Math.max(maxRow, item.y + 1)
  }

  const grid: PhysicalCell[][] = Array.from({ length: maxRow }, () =>
    Array.from({ length: maxCol }, (): PhysicalCell => ({ type: 'empty' })),
  )

  for (const item of items) {
    if (item.type === 'key') {
      grid[item.y][item.x] = { type: 'key', matrixRow: item.matrixRow, matrixCol: item.matrixCol }
    } else {
      grid[item.y][item.x] = { type: 'encoder', encoderIndex: item.matrixRow }
    }
  }

  return grid
}

// --- Store ---

const deviceStore = useDeviceStore()

// --- Reactive state ---

const activeLayer = ref(0)
const loading = ref(false)
const saving = ref(false)
const fetchError = ref<string | null>(null)
const saveError = ref<string | null>(null)

const physicalLayout = ref<PhysicalCell[][]>(createDemoLayout())
const layerCount = ref(DEMO_DEFAULTS.layers)
const layers = computed(() => Array.from({ length: layerCount.value }, (_, index) => index))

const keymap = ref<number[][][]>(createEmptyKeymapGrid(DEMO_DEFAULTS))
const encoderMap = ref<EncoderActions[][]>(createEmptyEncoderGrid(DEMO_DEFAULTS))

const selection = ref<Selection | null>(null)
const expandedEncoder = ref<number | null>(null)

// --- Grid layout computeds ---

const gridCols = computed(() => physicalLayout.value[0]?.length ?? 0)
const gridRows = computed(() => physicalLayout.value.length)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridCols.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridRows.value}, 1fr)`,
  aspectRatio: `${gridCols.value} / ${gridRows.value}`,
}))

const hasTopEncoders = computed(() =>
  physicalLayout.value[0]?.some((cell) => cell.type === 'encoder') ?? false,
)

// --- Cell size tracking for encoder popup sizing ---
// Must match POPUP_SCALE in KeymapEncoder.vue.
// When encoders sit in the top row, their expanded popup floats above
// the grid - popupReserve adds enough vertical padding to prevent clipping.

const POPUP_SCALE = 0.6
const gridEl = useTemplateRef<HTMLElement>('grid')
const cellSize = ref(0)
let resizeObserver: ResizeObserver | null = null

function attachResizeObserver() {
  resizeObserver?.disconnect()
  if (!gridEl.value) return

  resizeObserver = new ResizeObserver(([entry]) => {
    const gap = parseFloat(getComputedStyle(entry.target).columnGap) || 0
    cellSize.value = (entry.contentRect.width - gap * (gridCols.value - 1)) / gridCols.value
  })
  resizeObserver.observe(gridEl.value)
}

const popupReserve = computed(() => {
  if (!hasTopEncoders.value || cellSize.value === 0) return '0px'
  const buttonHeight = cellSize.value * POPUP_SCALE
  const buttonPadding = buttonHeight * 0.08
  const buttonMargin = cellSize.value * 0.08
  const totalHeight = buttonHeight + 2 * buttonPadding + buttonMargin
  return `${totalHeight * 0.6}px`
})

// --- Active layer accessors ---

function keyAt(matrixRow: number, matrixCol: number): number {
  return keymap.value[activeLayer.value][matrixRow][matrixCol]
}

function encoderAt(encoderIndex: number): EncoderActions {
  return encoderMap.value[activeLayer.value][encoderIndex]
}

function switchLayer(layer: number) {
  activeLayer.value = layer
  selection.value = null
  expandedEncoder.value = null
}

// --- Selection ---

function selectKey(matrixRow: number, matrixCol: number) {
  expandedEncoder.value = null
  selection.value = { type: 'key', matrixRow, matrixCol }
}

function toggleEncoder(encoderIndex: number) {
  if (expandedEncoder.value === encoderIndex) {
    expandedEncoder.value = null
    selection.value = null
  } else {
    expandedEncoder.value = encoderIndex
    selection.value = { type: 'encoder', encoderIndex, action: 'ccw' }
  }
}

function selectEncoderAction(encoderIndex: number, action: EncoderActionName) {
  selection.value = { type: 'encoder', encoderIndex, action }
}

function isKeySelected(matrixRow: number, matrixCol: number) {
  return selection.value?.type === 'key'
    && selection.value.matrixRow === matrixRow
    && selection.value.matrixCol === matrixCol
}

function encoderSelectedAction(encoderIndex: number): EncoderActionName | null {
  if (selection.value?.type === 'encoder' && selection.value.encoderIndex === encoderIndex) {
    return selection.value.action
  }
  return null
}

function assignFromPalette(code: number) {
  const selected = selection.value
  if (!selected) return

  const layer = activeLayer.value

  if (selected.type === 'key') {
    keymap.value[layer][selected.matrixRow][selected.matrixCol] = code
  } else {
    encoderMap.value[layer][selected.encoderIndex][selected.action] = code
  }
}

// --- Device communication ---

async function fetchFromDevice() {
  loading.value = true
  fetchError.value = null

  try {
    const metadata = await deviceStore.requestMetadata()
    layerCount.value = metadata.layers

    const layoutItems = await deviceStore.requestLayout()
    physicalLayout.value = buildPhysicalLayout(layoutItems)

    keymap.value = createEmptyKeymapGrid(metadata)
    encoderMap.value = createEmptyEncoderGrid(metadata)

    for (let layer = 0; layer < metadata.layers; layer++) {
      const layerData = await deviceStore.requestKeymap(layer)
      keymap.value[layer] = layerData.keys
      encoderMap.value[layer] = layerData.encoders
    }
  } catch (fetchException) {
    fetchError.value = fetchException instanceof Error ? fetchException.message : 'Failed to fetch keymap'
    console.error('Keymap fetch failed:', fetchException)
  } finally {
    loading.value = false
  }
}

async function saveToDevice() {
  if (deviceStore.demoMode) return

  saving.value = true
  saveError.value = null

  try {
    const keyCells: PhysicalKey[] = []
    const encoderCells: PhysicalEncoder[] = []
    for (const row of physicalLayout.value) {
      for (const cell of row) {
        if (cell.type === 'key') keyCells.push(cell)
        else if (cell.type === 'encoder') encoderCells.push(cell)
      }
    }

    for (let layer = 0; layer < layerCount.value; layer++) {
      for (const cell of keyCells) {
        const keycode = keymap.value[layer][cell.matrixRow][cell.matrixCol]
        await deviceStore.setMatrixKey(layer, cell.matrixRow, cell.matrixCol, keycode)
      }
      for (const cell of encoderCells) {
        const encoder = encoderMap.value[layer][cell.encoderIndex]
        await deviceStore.setEncoderKey(layer, cell.encoderIndex, 'cw', encoder.cw)
        await deviceStore.setEncoderKey(layer, cell.encoderIndex, 'ccw', encoder.ccw)
        await deviceStore.setEncoderKey(layer, cell.encoderIndex, 'sw', encoder.sw)
      }
    }
  } catch (saveException) {
    saveError.value = saveException instanceof Error ? saveException.message : 'Failed to save keymap'
    console.error('Save failed:', saveException)
  } finally {
    saving.value = false
  }
}

// --- Lifecycle ---

onMounted(() => {
  if (!deviceStore.demoMode && deviceStore.isConnected) {
    fetchFromDevice()
  }
})

// The grid element only exists when loading is false (guarded by v-if in template).
// Re-attach the ResizeObserver whenever the grid ref becomes available.
watch(gridEl, attachResizeObserver)

onUnmounted(() => resizeObserver?.disconnect())
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 :size="32" class="animate-spin text-accent" />
      <p class="text-sm text-text-muted">{{ $t('keymap.readingKeymap') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="fetchError" class="flex flex-1 flex-col items-center justify-center gap-4">
      <p class="text-sm text-error">{{ fetchError }}</p>
      <button
        class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
        @click="fetchFromDevice"
      >
        {{ $t('keymap.retry') }}
      </button>
    </div>

    <!-- Keymap editor -->
    <template v-else>
      <!-- Header -->
      <header class="flex items-center justify-between border-b border-border px-6 py-4">
        <p class="text-sm text-text-muted">{{ $t('keymap.configureDescription') }}</p>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-text-muted">{{ $t('keymap.layers') }}</span>
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
            class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-50"
            :disabled="saving"
            @click="saveToDevice"
          >
            <Loader2 v-if="saving" :size="16" class="animate-spin" />
            <Save v-else :size="16" />
            {{ saving ? $t('keymap.saving') : $t('keymap.saveChanges') }}
          </button>
        </div>
      </header>

      <!-- Save error -->
      <div v-if="saveError" class="border-b border-error/30 bg-error/10 px-6 py-2">
        <p class="text-sm text-error">{{ saveError }}</p>
      </div>

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
            <template v-for="(row, rowIndex) in physicalLayout" :key="rowIndex">
              <template v-for="(cell, colIndex) in row" :key="colIndex">
                <KeymapKey
                  v-if="cell.type === 'key'"
                  :label="keycodeLabel(keyAt(cell.matrixRow, cell.matrixCol))"
                  :selected="isKeySelected(cell.matrixRow, cell.matrixCol)"
                  @select="selectKey(cell.matrixRow, cell.matrixCol)"
                />
                <KeymapEncoder
                  v-else-if="cell.type === 'encoder'"
                  :ccw-label="keycodeLabel(encoderAt(cell.encoderIndex).ccw)"
                  :sw-label="keycodeLabel(encoderAt(cell.encoderIndex).sw)"
                  :cw-label="keycodeLabel(encoderAt(cell.encoderIndex).cw)"
                  :expanded="expandedEncoder === cell.encoderIndex"
                  :selected-action="encoderSelectedAction(cell.encoderIndex)"
                  :cell-size="cellSize"
                  @toggle-expand="toggleEncoder(cell.encoderIndex)"
                  @select="selectEncoderAction(cell.encoderIndex, $event)"
                />
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
    </template>
  </div>
</template>