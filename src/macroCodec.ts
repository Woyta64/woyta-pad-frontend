/**
 * Macro encoding/decoding between UI state and firmware binary format.
 *
 * Slot format (256 bytes):
 *   byte 0:      status (0xFF = empty, 0x01 = active)
 *   byte 1:      action_count
 *   bytes 2-254: action data (3-byte actions + 1-byte END terminator)
 *   byte 255:    reserved
 *
 * Action opcodes (3 bytes each, except END which is 1 byte):
 *   0x00 MACRO_END   — terminator
 *   0x01 MACRO_TAP   — [modifier_mask, keycode]
 *   0x02 MACRO_DOWN  — [modifier_mask, keycode]
 *   0x03 MACRO_UP    — [modifier_mask, keycode]
 *   0x04 MACRO_DELAY — [delay_hi, delay_lo] (big-endian ms)
 */

// --- Opcodes ---

const OPCODE_END = 0x00
const OPCODE_TAP = 0x01
const OPCODE_DOWN = 0x02
const OPCODE_UP = 0x03
const OPCODE_DELAY = 0x04

const STATUS_EMPTY = 0xff

// Max actions that fit in 253-byte data area: floor((253 - 1) / 3) = 84
const MAX_MACRO_ACTIONS = 84

// --- Modifier keycode <-> mask ---

function isModifierKeycode(keycode: number): boolean {
  return keycode >= 0xe0 && keycode <= 0xe7
}

function keycodeToModifierMask(keycode: number): number {
  return 1 << (keycode - 0xe0)
}

function firstKeycodeFromModifierMask(mask: number): number {
  for (let bit = 0; bit < 8; bit++) {
    if (mask & (1 << bit)) return 0xe0 + bit
  }
  return 0
}

import type { CharMapping } from '@/keyboardLayouts'

// --- Types ---

export type MacroType = 'sequence' | 'shortcut' | 'string'
export type MacroActionType = 'tap' | 'keydown' | 'keyup' | 'delay'

export interface DecodedAction {
  type: MacroActionType
  keycode?: number
  delayMs?: number
}

export interface DecodedKey {
  keycode: number
}

export interface DecodedMacro {
  isEmpty: boolean
  macroType: MacroType
  sequenceActions: DecodedAction[]
  shortcutKeys: DecodedKey[]
  typeString: string
}

export interface EncodeResult {
  actionCount: number
  data: Uint8Array
}

// --- Internal parsed action (raw opcode + 2 bytes) ---

interface RawAction {
  opcode: number
  byte1: number
  byte2: number
}

function parseRawActions(data: Uint8Array, actionCount: number): RawAction[] {
  const actions: RawAction[] = []
  let offset = 0
  for (let i = 0; i < actionCount && offset + 2 < data.length; i++) {
    const opcode = data[offset]
    if (opcode === OPCODE_END) break
    actions.push({ opcode, byte1: data[offset + 1], byte2: data[offset + 2] })
    offset += 3
  }
  return actions
}

// --- Encoding helpers ---

function encodeKeyAction(opcode: number, keycode: number): [number, number, number] {
  if (isModifierKeycode(keycode)) {
    return [opcode, keycodeToModifierMask(keycode), 0x00]
  }
  return [opcode, 0x00, keycode & 0xff]
}

// --- Encode ---

export function encodeMacro(
  macro: {
    macroType: MacroType
    sequenceActions: { type: MacroActionType; keycode?: number; delayMs?: number }[]
    shortcutKeys: { keycode: number }[]
    typeString: string
  },
  charToHid: Map<string, CharMapping>,
): EncodeResult {
  const bytes: number[] = []
  let actionCount = 0

  if (macro.macroType === 'sequence') {
    for (const action of macro.sequenceActions) {
      if (actionCount >= MAX_MACRO_ACTIONS) break
      if (action.type === 'delay') {
        const delayMs = Math.max(0, Math.min(action.delayMs ?? 0, 0xffff))
        bytes.push(OPCODE_DELAY, (delayMs >> 8) & 0xff, delayMs & 0xff)
      } else {
        const opcode = action.type === 'tap' ? OPCODE_TAP
          : action.type === 'keydown' ? OPCODE_DOWN
          : OPCODE_UP
        bytes.push(...encodeKeyAction(opcode, action.keycode ?? 0))
      }
      actionCount++
    }
  } else if (macro.macroType === 'shortcut') {
    // DOWN each key, then UP each in reverse
    const keys = macro.shortcutKeys.slice(0, Math.floor(MAX_MACRO_ACTIONS / 2))
    for (const key of keys) {
      bytes.push(...encodeKeyAction(OPCODE_DOWN, key.keycode))
      actionCount++
    }
    for (const key of [...keys].reverse()) {
      bytes.push(...encodeKeyAction(OPCODE_UP, key.keycode))
      actionCount++
    }
  } else {
    // String type: each character -> MACRO_TAP with modifier + keycode
    for (const char of macro.typeString) {
      if (actionCount >= MAX_MACRO_ACTIONS) break
      const mapping = charToHid.get(char)
      if (!mapping) continue // skip unmappable characters
      bytes.push(OPCODE_TAP, mapping.modifierMask, mapping.keycode)
      actionCount++
    }
  }

  // Append END terminator
  bytes.push(OPCODE_END)

  return { actionCount, data: new Uint8Array(bytes) }
}

// --- Decode ---

function rawActionToKeycode(action: RawAction): number {
  if (action.byte2 !== 0) return action.byte2
  if (action.byte1 !== 0) return firstKeycodeFromModifierMask(action.byte1)
  return 0
}

function detectMacroType(actions: RawAction[], hidToChar: Map<string, string>): MacroType {
  if (actions.length === 0) return 'sequence'

  // String detection: all TAPs, all reverse-mappable to characters
  if (actions.every((action) => action.opcode === OPCODE_TAP)) {
    const allMappable = actions.every((action) =>
      hidToChar.has(`${action.byte1}:${action.byte2}`),
    )
    if (allMappable) return 'string'
  }

  // Shortcut detection: N DOWNs followed by N matching UPs in reverse
  if (actions.length >= 2 && actions.length % 2 === 0) {
    const half = actions.length / 2
    const downHalf = actions.slice(0, half)
    const upHalf = actions.slice(half)

    const allDown = downHalf.every((action) => action.opcode === OPCODE_DOWN)
    const allUp = upHalf.every((action) => action.opcode === OPCODE_UP)

    if (allDown && allUp) {
      const isReversed = downHalf.every((down, index) => {
        const up = upHalf[half - 1 - index]
        return down.byte1 === up.byte1 && down.byte2 === up.byte2
      })
      if (isReversed) return 'shortcut'
    }
  }

  return 'sequence'
}

export function decodeMacro(slotBytes: Uint8Array, hidToChar: Map<string, string>): DecodedMacro {
  const status = slotBytes[0]
  const actionCount = slotBytes[1]
  const data = slotBytes.slice(2, 255)

  if (status === STATUS_EMPTY || actionCount === 0) {
    return {
      isEmpty: true,
      macroType: 'sequence',
      sequenceActions: [],
      shortcutKeys: [],
      typeString: '',
    }
  }

  const rawActions = parseRawActions(data, actionCount)
  const macroType = detectMacroType(rawActions, hidToChar)

  if (macroType === 'string') {
    const typeString = rawActions
      .map((action) => hidToChar.get(`${action.byte1}:${action.byte2}`) ?? '')
      .join('')
    return { isEmpty: false, macroType, sequenceActions: [], shortcutKeys: [], typeString }
  }

  if (macroType === 'shortcut') {
    const half = rawActions.length / 2
    const shortcutKeys: DecodedKey[] = rawActions
      .slice(0, half)
      .map((action) => ({ keycode: rawActionToKeycode(action) }))
    return { isEmpty: false, macroType, sequenceActions: [], shortcutKeys, typeString: '' }
  }

  // Sequence: convert each raw action to a decoded action
  const sequenceActions: DecodedAction[] = []
  for (const raw of rawActions) {
    if (raw.opcode === OPCODE_DELAY) {
      sequenceActions.push({ type: 'delay', delayMs: (raw.byte1 << 8) | raw.byte2 })
    } else if (raw.opcode === OPCODE_TAP) {
      // Combined modifier+key TAP: expand to keydown(mod) + tap(key) + keyup(mod)
      if (raw.byte1 !== 0 && raw.byte2 !== 0) {
        sequenceActions.push({ type: 'keydown', keycode: firstKeycodeFromModifierMask(raw.byte1) })
        sequenceActions.push({ type: 'tap', keycode: raw.byte2 })
        sequenceActions.push({ type: 'keyup', keycode: firstKeycodeFromModifierMask(raw.byte1) })
      } else {
        sequenceActions.push({ type: 'tap', keycode: rawActionToKeycode(raw) })
      }
    } else if (raw.opcode === OPCODE_DOWN) {
      sequenceActions.push({ type: 'keydown', keycode: rawActionToKeycode(raw) })
    } else if (raw.opcode === OPCODE_UP) {
      sequenceActions.push({ type: 'keyup', keycode: rawActionToKeycode(raw) })
    }
  }

  return { isEmpty: false, macroType, sequenceActions, shortcutKeys: [], typeString: '' }
}