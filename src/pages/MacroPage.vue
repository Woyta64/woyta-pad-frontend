<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Trash2, Plus, Save, Copy,
  ChevronDown, ChevronUp,
  X, Timer, Keyboard, Type,
  ArrowDownToLine, ArrowUpFromLine, ArrowDownUp,
  Clock, Ellipsis, Check, Loader2, Download,
} from 'lucide-vue-next'
import KeyPalette from '@/components/KeyPalette.vue'
import { keycodeLabel } from '@/keycodes'
import { useDeviceStore } from '@/stores/device'
import { encodeMacro, decodeMacro } from '@/macroCodec'
import { getSelectedLayout } from '@/keyboardLayouts'

// --- Types ---

type MacroType = 'sequence' | 'shortcut' | 'string'
type SequenceActionType = 'tap' | 'keydown' | 'keyup' | 'delay'

interface SequenceAction {
  id: number
  type: SequenceActionType
  keycode?: number
  label?: string
  delayMs?: number
  selected: boolean
}

interface ShortcutKey {
  id: number
  keycode: number
  label: string
}

interface MacroSlot {
  title: string
  macroType: MacroType
  sequenceActions: SequenceAction[]
  shortcutKeys: ShortcutKey[]
  typeString: string
}

interface MacroTypeOption {
  value: MacroType
  label: string
  description: string
}

// --- Constants ---

const MACRO_SLOT_COUNT = 128
const MAX_DELAY_MS = 60000
const MAX_SEQUENCE_ACTIONS = 84
const MAX_SHORTCUT_KEYS = 6
const MAX_STRING_CHARACTERS = 84
const MACRO_TITLES_STORAGE_KEY = 'woyta-pad-macro-titles'

const macroTypeOptions: MacroTypeOption[] = [
  {
    value: 'sequence',
    label: 'Timed Sequence',
    description: 'Key presses and releases with optional delays',
  },
  {
    value: 'shortcut',
    label: 'Shortcut',
    description: 'All keys pressed simultaneously',
  },
  {
    value: 'string',
    label: 'Type String',
    description: 'Types out a text string',
  },
]

const deviceStore = useDeviceStore()

// --- State ---

let nextId = 0

const selectedSlotIndex = ref(0)
const macroLoading = ref(false)
const macroSaving = ref(false)
const loadedSlotIndices = new Set<number>()
const addActionMenuOpen = ref(false)
const actionContextMenuId = ref<number | null>(null)
const selectedSequenceActionId = ref<number | null>(null)
const selectedShortcutKeyId = ref<number | null>(null)

function createEmptySlot(): MacroSlot {
  return {
    title: '',
    macroType: 'sequence',
    sequenceActions: [],
    shortcutKeys: [],
    typeString: '',
  }
}

const macroSlots = ref<MacroSlot[]>(
  Array.from({ length: MACRO_SLOT_COUNT }, createEmptySlot),
)

const selectedMacro = computed(() => macroSlots.value[selectedSlotIndex.value])

const hasSelectedActions = computed(() =>
  selectedMacro.value.sequenceActions.some((action) => action.selected),
)

const allActionsSelected = computed(() =>
  selectedMacro.value.sequenceActions.length > 0 &&
  selectedMacro.value.sequenceActions.every((action) => action.selected),
)

const sequenceAtLimit = computed(() =>
  selectedMacro.value.sequenceActions.length >= MAX_SEQUENCE_ACTIONS,
)

const shortcutAtLimit = computed(() =>
  selectedMacro.value.shortcutKeys.length >= MAX_SHORTCUT_KEYS,
)

const allowedCharacters = computed(() => getSelectedLayout().charToHid)

// --- Title persistence (localStorage) ---

function loadTitlesFromStorage() {
  const stored = localStorage.getItem(MACRO_TITLES_STORAGE_KEY)
  if (!stored) return
  const titles: string[] = JSON.parse(stored)
  for (let i = 0; i < titles.length && i < MACRO_SLOT_COUNT; i++) {
    macroSlots.value[i].title = titles[i]
  }
}

function saveTitlesToStorage() {
  const titles = macroSlots.value.map((slot) => slot.title)
  localStorage.setItem(MACRO_TITLES_STORAGE_KEY, JSON.stringify(titles))
}

onMounted(loadTitlesFromStorage)

watch(
  () => macroSlots.value.map((slot) => slot.title),
  saveTitlesToStorage,
  { deep: true },
)

// --- Slot management ---

function clearSlot(index: number) {
  macroSlots.value[index] = createEmptySlot()
}

// --- Sequence actions ---

function createSequenceAction(type: SequenceActionType): SequenceAction {
  return {
    id: nextId++,
    type,
    selected: false,
    ...(type === 'delay' ? { delayMs: 100 } : { keycode: 0, label: 'None' }),
  }
}

function addSequenceAction(type: SequenceActionType) {
  if (sequenceAtLimit.value) return
  selectedMacro.value.sequenceActions.push(createSequenceAction(type))
  addActionMenuOpen.value = false
}

function capDelayMs(action: SequenceAction) {
  action.delayMs = Math.min(Math.max(action.delayMs ?? 1, 1), MAX_DELAY_MS)
}

function toggleSelectAll() {
  const actions = selectedMacro.value.sequenceActions
  const shouldSelect = !actions.every((action) => action.selected)
  for (const action of actions) {
    action.selected = shouldSelect
  }
}

function duplicateSelectedActions() {
  const actions = selectedMacro.value.sequenceActions
  const copies = actions
    .filter((action) => action.selected)
    .map((action) => ({ ...action, id: nextId++, selected: false }))
  actions.push(...copies)
}

function deleteSelectedActions() {
  selectedMacro.value.sequenceActions = selectedMacro.value.sequenceActions.filter(
    (action) => !action.selected,
  )
}

function duplicateAction(actionId: number) {
  const actions = selectedMacro.value.sequenceActions
  const index = actions.findIndex((action) => action.id === actionId)
  if (index === -1) return
  const copy = { ...actions[index], id: nextId++, selected: false }
  actions.splice(index + 1, 0, copy)
  actionContextMenuId.value = null
}

function deleteAction(actionId: number) {
  selectedMacro.value.sequenceActions = selectedMacro.value.sequenceActions.filter(
    (action) => action.id !== actionId,
  )
  actionContextMenuId.value = null
}

function toggleActionSelected(actionId: number) {
  const action = selectedMacro.value.sequenceActions.find((action) => action.id === actionId)
  if (action) {
    action.selected = !action.selected
  }
}

function moveActionUp(index: number) {
  if (index <= 0) return
  const actions = selectedMacro.value.sequenceActions
  const previous = actions[index - 1]
  actions[index - 1] = actions[index]
  actions[index] = previous
}

function moveActionDown(index: number) {
  const actions = selectedMacro.value.sequenceActions
  if (index >= actions.length - 1) return
  const next = actions[index + 1]
  actions[index + 1] = actions[index]
  actions[index] = next
}

// --- Macro type switching ---

function switchMacroType(newType: MacroType) {
  const macro = selectedMacro.value
  if (macro.macroType === newType) return

  macro.sequenceActions = []
  macro.shortcutKeys = []
  macro.typeString = ''
  macro.macroType = newType
}

// --- String input filtering ---

function filterTypeString(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  const charMap = allowedCharacters.value
  const filtered = [...textarea.value]
    .filter((character) => charMap.has(character))
    .slice(0, MAX_STRING_CHARACTERS)
    .join('')
  selectedMacro.value.typeString = filtered
}

// --- Shortcut keys ---

function addShortcutKey() {
  if (shortcutAtLimit.value) return
  selectedMacro.value.shortcutKeys.push({
    id: nextId++,
    keycode: 0,
    label: 'None',
  })
}

function removeShortcutKey(keyId: number) {
  selectedMacro.value.shortcutKeys = selectedMacro.value.shortcutKeys.filter(
    (key) => key.id !== keyId,
  )
}

// --- Palette assignment ---

function assignFromPalette(code: number) {
  const macro = selectedMacro.value
  const label = keycodeLabel(code)

  if (macro.macroType === 'sequence') {
    const action = macro.sequenceActions.find(
      (action) => action.id === selectedSequenceActionId.value,
    )
    if (action && action.type !== 'delay') {
      action.keycode = code
      action.label = label
    }
  } else if (macro.macroType === 'shortcut') {
    const existingKey = macro.shortcutKeys.find(
      (key) => key.id === selectedShortcutKeyId.value,
    )
    if (existingKey) {
      existingKey.keycode = code
      existingKey.label = label
      selectedShortcutKeyId.value = null
    } else if (!shortcutAtLimit.value) {
      macro.shortcutKeys.push({
        id: nextId++,
        keycode: code,
        label,
      })
    }
  }
}

// --- Device communication ---

async function loadMacroFromDevice(slotIndex: number) {
  if (deviceStore.demoMode || !deviceStore.isConnected) return
  if (loadedSlotIndices.has(slotIndex)) return

  macroLoading.value = true
  try {
    const rawBytes = await deviceStore.requestMacro(slotIndex)
    if (selectedSlotIndex.value !== slotIndex) return // user switched away

    const decoded = decodeMacro(rawBytes, getSelectedLayout().hidToChar)
    const slot = macroSlots.value[slotIndex]
    const savedTitle = slot.title

    if (decoded.isEmpty) {
      macroSlots.value[slotIndex] = createEmptySlot()
      macroSlots.value[slotIndex].title = savedTitle
    } else {
      slot.macroType = decoded.macroType
      slot.sequenceActions = decoded.sequenceActions.map((action) => ({
        id: nextId++,
        type: action.type,
        keycode: action.keycode,
        label: action.keycode !== undefined ? keycodeLabel(action.keycode) : undefined,
        delayMs: action.delayMs,
        selected: false,
      }))
      slot.shortcutKeys = decoded.shortcutKeys.map((key) => ({
        id: nextId++,
        keycode: key.keycode,
        label: keycodeLabel(key.keycode),
      }))
      slot.typeString = decoded.typeString
    }
    loadedSlotIndices.add(slotIndex)
  } catch (error) {
    console.error(`Failed to load macro slot ${slotIndex}:`, error)
  } finally {
    macroLoading.value = false
  }
}

async function saveMacroToDevice() {
  if (deviceStore.demoMode || !deviceStore.isConnected) return

  macroSaving.value = true
  try {
    const slot = selectedMacro.value
    const slotIndex = selectedSlotIndex.value

    const isEmpty =
      (slot.macroType === 'sequence' && slot.sequenceActions.length === 0) ||
      (slot.macroType === 'shortcut' && slot.shortcutKeys.length === 0) ||
      (slot.macroType === 'string' && slot.typeString === '')

    if (isEmpty) {
      await deviceStore.clearMacro(slotIndex)
    } else {
      const { actionCount, data } = encodeMacro({
        macroType: slot.macroType,
        sequenceActions: slot.sequenceActions,
        shortcutKeys: slot.shortcutKeys,
        typeString: slot.typeString,
      }, getSelectedLayout().charToHid)
      await deviceStore.setMacro(slotIndex, actionCount, data)
    }
  } catch (error) {
    console.error('Failed to save macro:', error)
  } finally {
    macroSaving.value = false
  }
}

async function loadAllMacrosFromDevice() {
  if (deviceStore.demoMode || !deviceStore.isConnected) return

  macroLoading.value = true
  loadedSlotIndices.clear()
  try {
    for (let slotIndex = 0; slotIndex < MACRO_SLOT_COUNT; slotIndex++) {
      const rawBytes = await deviceStore.requestMacro(slotIndex)
      console.log(`Raw bytes for slot ${slotIndex}:`, rawBytes)
      const decoded = decodeMacro(rawBytes, getSelectedLayout().hidToChar)
      const slot = macroSlots.value[slotIndex]
      const savedTitle = slot.title

      if (decoded.isEmpty) {
        macroSlots.value[slotIndex] = createEmptySlot()
        macroSlots.value[slotIndex].title = savedTitle
      } else {
        slot.macroType = decoded.macroType
        slot.sequenceActions = decoded.sequenceActions.map((action) => ({
          id: nextId++,
          type: action.type,
          keycode: action.keycode,
          label: action.keycode !== undefined ? keycodeLabel(action.keycode) : undefined,
          delayMs: action.delayMs,
          selected: false,
        }))
        slot.shortcutKeys = decoded.shortcutKeys.map((key) => ({
          id: nextId++,
          keycode: key.keycode,
          label: keycodeLabel(key.keycode),
        }))
        slot.typeString = decoded.typeString
      }
      loadedSlotIndices.add(slotIndex)
    }
  } catch (error) {
    console.error('Failed to load macros from device:', error)
  } finally {
    macroLoading.value = false
  }
}

onMounted(() => {
  if (!deviceStore.demoMode && deviceStore.isConnected) {
    loadMacroFromDevice(selectedSlotIndex.value)
  }
})

watch(selectedSlotIndex, (newIndex) => {
  if (!deviceStore.demoMode && deviceStore.isConnected) {
    loadMacroFromDevice(newIndex)
  }
})
</script>

<template>
  <div class="flex h-full flex-col">

    <!-- Header -->
    <header class="flex items-center justify-between border-b border-border px-6 py-4">
      <p class="text-sm text-text-muted">Configure macro sequences</p>
      <div class="flex gap-2">
        <button
          class="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-light transition-colors hover:border-text-muted hover:text-text-heading disabled:opacity-40"
          :disabled="macroLoading || !deviceStore.isConnected || deviceStore.demoMode"
          @click="loadAllMacrosFromDevice"
        >
          <Loader2 v-if="macroLoading" :size="16" class="animate-spin" />
          <Download v-else :size="16" />
          {{ macroLoading ? 'Loading...' : 'Load All' }}
        </button>
        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-40"
          :disabled="macroSaving || !deviceStore.isConnected || deviceStore.demoMode"
          @click="saveMacroToDevice"
        >
          <Loader2 v-if="macroSaving" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          {{ macroSaving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </header>

    <!-- Content - three panels side by side -->
    <div class="flex min-h-0 basis-3/5 gap-4 p-4">

      <!-- Left panel - macro slot list -->
      <div class="flex w-lg shrink-0 flex-col rounded-lg border border-border bg-surface p-6">
        <h2 class="text-sm font-semibold text-text-heading">Macro</h2>
        <p class="mt-1 text-xs text-text-muted">
          To assign macro, select macro and click keys on the above keymap.
        </p>

        <!-- Slot list -->
        <div class="scrollbar-thin mt-3 flex flex-1 flex-col gap-2 overflow-y-auto pr-3">
          <div
            v-for="(slot, index) in macroSlots"
            :key="index"
            class="flex items-center gap-2 rounded-lg border p-2 transition-colors"
            :class="
              selectedSlotIndex === index
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-text-muted'
            "
            @click="selectedSlotIndex = index"
          >
            <!-- Macro badge -->
            <div
              class="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded bg-surface-raised text-text-light"
            >
              <span class="text-[0.5rem] font-bold leading-tight">M</span>
              <span class="text-xs font-bold leading-tight">{{ index + 1 }}</span>
            </div>

            <!-- Title input -->
            <input
              v-model="slot.title"
              type="text"
              placeholder="Custom title (optional)"
              class="min-w-0 flex-1 rounded bg-surface-raised px-2 py-1.5 text-xs text-text-light placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              @click.stop
            />

            <!-- Clear button -->
            <button
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-error/10 hover:text-error"
              @click.stop="clearSlot(index)"
            >
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Middle panel - macro type selector -->
      <div class="flex w-64 shrink-0 flex-col gap-4">
        <div class="flex items-center">
          <h3 class="text-sm font-medium text-text-light">Macro Type</h3>
        </div>

        <div class="flex flex-col gap-2">
          <button
            v-for="option in macroTypeOptions"
            :key="option.value"
            class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors"
            :class="
              selectedMacro.macroType === option.value
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-text-muted'
            "
            @click="switchMacroType(option.value)"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-raised">
              <Timer    v-if="option.value === 'sequence'"  :size="18" class="text-text-muted" />
              <Keyboard v-else-if="option.value === 'shortcut'" :size="18" class="text-text-muted" />
              <Type     v-else                              :size="18" class="text-text-muted" />
            </span>
            <span>
              <span
                class="block text-sm font-medium"
                :class="selectedMacro.macroType === option.value ? 'text-accent' : 'text-text-light'"
              >
                {{ option.label }}
              </span>
              <span class="block text-xs text-text-muted">{{ option.description }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Right panel - macro editor, content depends on selected macro type -->
      <div class="flex flex-1 flex-col">

        <!-- Timed sequence editor -->
        <template v-if="selectedMacro.macroType === 'sequence'">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium text-text-light">Sequence Actions</h3>
              <span
                class="text-xs"
                :class="sequenceAtLimit ? 'text-error' : 'text-text-muted'"
              >
                {{ selectedMacro.sequenceActions.length }} / {{ MAX_SEQUENCE_ACTIONS }}
              </span>
            </div>
            <div class="flex gap-2">
              <button
                class="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-light"
                @click="toggleSelectAll"
              >
                <Check :size="12" />
                {{ allActionsSelected ? 'Deselect All' : 'Select All' }}
              </button>
              <button
                class="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-light disabled:opacity-40"
                :disabled="!hasSelectedActions"
                @click="duplicateSelectedActions"
              >
                <Copy :size="12" />
                Duplicate
              </button>
              <button
                class="flex items-center gap-1.5 rounded border border-border px-3 py-1 text-xs text-text-muted transition-colors hover:border-error hover:text-error disabled:opacity-40"
                :disabled="!hasSelectedActions"
                @click="deleteSelectedActions"
              >
                <Trash2 :size="12" />
                Delete
              </button>
            </div>
          </div>

          <!-- Action list -->
          <div class="scrollbar-thin mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
            <div
              v-for="(action, actionIndex) in selectedMacro.sequenceActions"
              :key="action.id"
              class="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
              :class="
                action.selected
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-text-muted'
              "
            >
              <!-- Selection circle -->
              <button
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                :class="
                  action.selected
                    ? 'border-accent bg-accent'
                    : 'border-text-muted hover:border-text-light'
                "
                @click="toggleActionSelected(action.id)"
              >
                <Check v-if="action.selected" :size="14" class="text-bg" />
              </button>

              <!-- Step index -->
              <span class="w-4 shrink-0 text-sm text-text-muted">{{ actionIndex + 1 }}</span>

              <!-- Action type icon -->
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-raised">
                <ArrowDownUp     v-if="action.type === 'tap'"       :size="16" class="text-text-muted" />
                <ArrowDownToLine v-else-if="action.type === 'keydown'"  :size="16" class="text-text-muted" />
                <ArrowUpFromLine v-else-if="action.type === 'keyup'" :size="16" class="text-text-muted" />
                <Clock           v-else-if="action.type === 'delay'" :size="16" class="text-text-muted" />
              </div>

              <!-- Delay input or key label button -->
              <div v-if="action.type === 'delay'" class="relative min-w-0 flex-1">
                <input
                  v-model.number="action.delayMs"
                  type="number"
                  min="1"
                  :max="MAX_DELAY_MS"
                  class="no-spinners w-full rounded bg-surface-raised py-1.5 pl-3 pr-28 text-sm text-text-light focus:outline-none focus:ring-1 focus:ring-accent"
                  @click.stop
                  @change="capDelayMs(action)"
                />
                <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                  ms · 1 – 60 000
                </span>
              </div>
              <button
                v-else
                class="min-w-0 flex-1 cursor-pointer rounded px-3 py-1.5 text-left text-sm transition-colors"
                :class="
                  selectedSequenceActionId === action.id
                    ? 'bg-accent/20 text-accent ring-1 ring-accent'
                    : 'bg-surface-raised text-text-light'
                "
                @click.stop="selectedSequenceActionId = selectedSequenceActionId === action.id ? null : action.id"
              >
                {{ action.label ?? `0x${action.keycode?.toString(16).padStart(2, '0')}` }}
              </button>

              <!-- Reorder buttons -->
              <button
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-muted transition-colors hover:text-text-light disabled:opacity-30"
                :disabled="actionIndex === 0"
                @click.stop="moveActionUp(actionIndex)"
              >
                <ChevronUp :size="16" />
              </button>
              <button
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-muted transition-colors hover:text-text-light disabled:opacity-30"
                :disabled="actionIndex === selectedMacro.sequenceActions.length - 1"
                @click.stop="moveActionDown(actionIndex)"
              >
                <ChevronDown :size="16" />
              </button>

              <!-- Context menu -->
              <div class="relative shrink-0">
                <button
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-text-muted transition-colors hover:text-text-light"
                  :class="actionContextMenuId === action.id ? 'text-text-light' : ''"
                  @click.stop="actionContextMenuId = actionContextMenuId === action.id ? null : action.id"
                >
                  <Ellipsis :size="16" />
                </button>

                <div
                  v-if="actionContextMenuId === action.id"
                  class="absolute right-0 top-full z-10 mt-1 flex w-32 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
                >
                  <button
                    class="flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-light transition-colors hover:bg-surface-raised"
                    @click.stop="duplicateAction(action.id)"
                  >
                    <Copy :size="14" class="text-text-muted" />
                    Duplicate
                  </button>
                  <button
                    class="flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/10"
                    @click.stop="deleteAction(action.id)"
                  >
                    <Trash2 :size="14" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Add action button with dropdown -->
            <div class="relative">
              <button
                class="flex w-full items-center justify-center rounded-lg border border-border py-2 text-text-muted transition-colors hover:border-text-muted hover:text-text-light disabled:opacity-40"
                :disabled="sequenceAtLimit"
                @click="addActionMenuOpen = !addActionMenuOpen"
              >
                <Plus :size="18" />
              </button>

              <div
                v-if="addActionMenuOpen"
                class="absolute top-full z-10 mt-1 flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
              >
                <button
                  class="px-4 py-2.5 text-left text-sm text-text-light transition-colors hover:bg-surface-raised"
                  @click="addSequenceAction('tap')"
                >
                  Tap
                </button>
                <button
                  class="px-4 py-2.5 text-left text-sm text-text-light transition-colors hover:bg-surface-raised"
                  @click="addSequenceAction('keydown')"
                >
                  Key Down
                </button>
                <button
                  class="px-4 py-2.5 text-left text-sm text-text-light transition-colors hover:bg-surface-raised"
                  @click="addSequenceAction('keyup')"
                >
                  Key Up
                </button>
                <button
                  class="px-4 py-2.5 text-left text-sm text-text-light transition-colors hover:bg-surface-raised"
                  @click="addSequenceAction('delay')"
                >
                  Delay
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Shortcut editor -->
        <template v-else-if="selectedMacro.macroType === 'shortcut'">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-text-light">Shortcut Keys</h3>
            <span
              class="text-xs"
              :class="shortcutAtLimit ? 'text-error' : 'text-text-muted'"
            >
              {{ selectedMacro.shortcutKeys.length }} / {{ MAX_SHORTCUT_KEYS }}
            </span>
          </div>
          <p class="mt-1 text-xs text-text-muted">
            All keys will be pressed simultaneously, like Ctrl+Alt+Del.
          </p>

          <!-- Key combination display -->
          <div class="mt-4 flex flex-wrap items-center gap-2">
            <div
              v-for="(key, keyIndex) in selectedMacro.shortcutKeys"
              :key="key.id"
              class="flex items-center gap-1"
            >
              <!-- Key chip - click to select for reassignment -->
              <button
                class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 transition-colors"
                :class="
                  selectedShortcutKeyId === key.id
                    ? 'border-accent bg-accent/20 ring-1 ring-accent'
                    : 'border-border bg-surface-raised'
                "
                @click="selectedShortcutKeyId = selectedShortcutKeyId === key.id ? null : key.id"
              >
                <span
                  class="text-sm font-medium"
                  :class="selectedShortcutKeyId === key.id ? 'text-accent' : 'text-text-light'"
                >
                  {{ key.label }}
                </span>
                <span
                  class="flex h-4 w-4 items-center justify-center rounded-full text-text-muted transition-colors hover:text-error"
                  @click.stop="removeShortcutKey(key.id)"
                >
                  <X :size="12" />
                </span>
              </button>

              <span
                v-if="keyIndex < selectedMacro.shortcutKeys.length - 1"
                class="text-sm font-bold text-text-muted"
              >
                +
              </span>
            </div>

            <button
              v-if="!shortcutAtLimit"
              class="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-text-muted hover:text-text-light"
              @click="addShortcutKey"
            >
              <Plus :size="14" />
              Add Key
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-if="selectedMacro.shortcutKeys.length === 0"
            class="flex flex-1 items-center justify-center"
          >
            <p class="text-sm text-text-muted">Add keys to create a keyboard shortcut</p>
          </div>
        </template>

        <!-- Type string editor -->
        <template v-else>
          <h3 class="text-sm font-medium text-text-light">Type String</h3>
          <p class="mt-1 text-xs text-text-muted">
            The macro will type out this text when triggered.
            Only characters supported by the selected keyboard layout are allowed.
          </p>

          <textarea
            :value="selectedMacro.typeString"
            :maxlength="MAX_STRING_CHARACTERS"
            placeholder="Enter text to type out (e.g. your email address)"
            class="mt-4 w-full flex-1 resize-none rounded-lg border border-border bg-surface-raised p-3 text-sm text-text-light placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            @input="filterTypeString"
          />

          <div class="mt-2 text-xs" :class="selectedMacro.typeString.length >= MAX_STRING_CHARACTERS ? 'text-error' : 'text-text-muted'">
            {{ selectedMacro.typeString.length }} / {{ MAX_STRING_CHARACTERS }} characters
          </div>
        </template>

      </div>
    </div>

    <!-- Key palette -->
    <div class="flex min-h-0 flex-1 flex-col border-t border-border px-6 py-4">
      <KeyPalette @assign="assignFromPalette" />
    </div>

  </div>
</template>