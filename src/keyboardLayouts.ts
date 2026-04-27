/**
 * Keyboard layout definitions for string macro encoding/decoding.
 * Each layout maps printable characters to HID keycodes + modifier masks.
 *
 * To add a new layout: define a CharDefinition[] array (see US_QWERTY_CHARS)
 * and register it in KEYBOARD_LAYOUTS via buildLayout().
 */

export interface CharMapping {
  modifierMask: number
  keycode: number
}

export interface KeyboardLayout {
  id: string
  label: string
  charToHid: Map<string, CharMapping>
  hidToChar: Map<string, string> // key: "modifierMask:keycode" → character
}

// [character, modifierMask, hidKeycode]
type CharDefinition = [string, number, number]

const LSHIFT = 0x02
const RALT = 0x40 // AltGr on Windows/Linux

function buildLayout(id: string, label: string, definitions: CharDefinition[]): KeyboardLayout {
  const charToHid = new Map<string, CharMapping>()
  const hidToChar = new Map<string, string>()

  for (const [char, modifierMask, keycode] of definitions) {
    charToHid.set(char, { modifierMask, keycode })
    hidToChar.set(`${modifierMask}:${keycode}`, char)
  }

  return { id, label, charToHid, hidToChar }
}

// --- Helper: generate letter definitions for QWERTY/QWERTZ base ---

function qwertyLetters(): CharDefinition[] {
  const definitions: CharDefinition[] = []
  for (let i = 0; i < 26; i++) {
    definitions.push([String.fromCharCode(0x61 + i), 0x00, 0x04 + i]) // a-z
    definitions.push([String.fromCharCode(0x41 + i), LSHIFT, 0x04 + i]) // A-Z
  }
  return definitions
}

function qwertzLetters(): CharDefinition[] {
  const definitions: CharDefinition[] = []
  for (let i = 0; i < 26; i++) {
    const hidKeycode = 0x04 + i
    // HID 0x1c = US 'y' position, HID 0x1d = US 'z' position
    // QWERTZ swaps: physical Z position (0x1d) types 'y', physical Y position (0x1c) types 'z'
    if (hidKeycode === 0x1c) {
      // US Y position → types 'z' on QWERTZ
      definitions.push(['z', 0x00, 0x1c])
      definitions.push(['Z', LSHIFT, 0x1c])
    } else if (hidKeycode === 0x1d) {
      // US Z position → types 'y' on QWERTZ
      definitions.push(['y', 0x00, 0x1d])
      definitions.push(['Y', LSHIFT, 0x1d])
    } else {
      definitions.push([String.fromCharCode(0x61 + i), 0x00, hidKeycode])
      definitions.push([String.fromCharCode(0x41 + i), LSHIFT, hidKeycode])
    }
  }
  return definitions
}

// --- Common whitespace (same across all layouts) ---

const WHITESPACE: CharDefinition[] = [
  [' ', 0x00, 0x2c],
  ['\n', 0x00, 0x28],
  ['\t', 0x00, 0x2b],
]

// ============================================================
// US QWERTY
// ============================================================

const US_QWERTY_CHARS: CharDefinition[] = [
  ...qwertyLetters(),
  ...WHITESPACE,

  // Digits (unshifted)
  ['1', 0x00, 0x1e], ['2', 0x00, 0x1f], ['3', 0x00, 0x20],
  ['4', 0x00, 0x21], ['5', 0x00, 0x22], ['6', 0x00, 0x23],
  ['7', 0x00, 0x24], ['8', 0x00, 0x25], ['9', 0x00, 0x26],
  ['0', 0x00, 0x27],

  // Shifted digits
  ['!', LSHIFT, 0x1e], ['@', LSHIFT, 0x1f], ['#', LSHIFT, 0x20],
  ['$', LSHIFT, 0x21], ['%', LSHIFT, 0x22], ['^', LSHIFT, 0x23],
  ['&', LSHIFT, 0x24], ['*', LSHIFT, 0x25], ['(', LSHIFT, 0x26],
  [')', LSHIFT, 0x27],

  // Unshifted punctuation
  ['-', 0x00, 0x2d], ['=', 0x00, 0x2e], ['[', 0x00, 0x2f],
  [']', 0x00, 0x30], ['\\', 0x00, 0x31], [';', 0x00, 0x33],
  ["'", 0x00, 0x34], ['`', 0x00, 0x35], [',', 0x00, 0x36],
  ['.', 0x00, 0x37], ['/', 0x00, 0x38],

  // Shifted punctuation
  ['_', LSHIFT, 0x2d], ['+', LSHIFT, 0x2e], ['{', LSHIFT, 0x2f],
  ['}', LSHIFT, 0x30], ['|', LSHIFT, 0x31], [':', LSHIFT, 0x33],
  ['"', LSHIFT, 0x34], ['~', LSHIFT, 0x35], ['<', LSHIFT, 0x36],
  ['>', LSHIFT, 0x37], ['?', LSHIFT, 0x38],
]

// ============================================================
// Czech QWERTZ (Windows standard layout)
// ============================================================

const CZECH_QWERTZ_CHARS: CharDefinition[] = [
  ...qwertzLetters(), // Z↔Y swapped
  ...WHITESPACE,

  // Digit row — unshifted = diacritics, shifted = digits (opposite of US!)
  ['+', 0x00, 0x1e],
  ['ě', 0x00, 0x1f], ['š', 0x00, 0x20], ['č', 0x00, 0x21],
  ['ř', 0x00, 0x22], ['ž', 0x00, 0x23], ['ý', 0x00, 0x24],
  ['á', 0x00, 0x25], ['í', 0x00, 0x26], ['é', 0x00, 0x27],

  // Digits (need Shift!)
  ['1', LSHIFT, 0x1e], ['2', LSHIFT, 0x1f], ['3', LSHIFT, 0x20],
  ['4', LSHIFT, 0x21], ['5', LSHIFT, 0x22], ['6', LSHIFT, 0x23],
  ['7', LSHIFT, 0x24], ['8', LSHIFT, 0x25], ['9', LSHIFT, 0x26],
  ['0', LSHIFT, 0x27],

  // Punctuation — different positions from US
  ['=', 0x00, 0x2d],           // US '-' key
  ['%', LSHIFT, 0x2d],         // Shift + US '-' key
  ['ú', 0x00, 0x2f],           // US '[' key
  ['/', LSHIFT, 0x2f],         // Shift + US '[' key
  [')', 0x00, 0x30],           // US ']' key
  ['(', LSHIFT, 0x30],         // Shift + US ']' key
  ['ů', 0x00, 0x33],           // US ';' key
  ['"', LSHIFT, 0x33],         // Shift + US ';' key
  ['§', 0x00, 0x34],           // US "'" key
  ['!', LSHIFT, 0x34],         // Shift + US "'" key
  [';', 0x00, 0x35],           // US '`' key
  ['°', LSHIFT, 0x35],         // Shift + US '`' key
  [',', 0x00, 0x36],           // same as US
  ['?', LSHIFT, 0x36],         // Shift + comma
  ['.', 0x00, 0x37],           // same as US
  [':', LSHIFT, 0x37],         // Shift + period
  ['-', 0x00, 0x38],           // US '/' key
  ['_', LSHIFT, 0x38],         // Shift + US '/' key
  ["'", LSHIFT, 0x32],         // Shift + IntlHash (ISO key next to Enter)

  // ISO extra key (between left Shift and Z)
  ['<', 0x00, 0x64],           // IntlBackslash
  ['>', LSHIFT, 0x64],         // Shift + IntlBackslash

  // AltGr characters (RAlt = 0x40)
  ['@', RALT, 0x19],           // AltGr + V
  ['\\', RALT, 0x14],          // AltGr + Q
  ['|', RALT, 0x1a],           // AltGr + W
  ['€', RALT, 0x08],           // AltGr + E
  ['#', RALT, 0x1b],           // AltGr + X
  ['&', RALT, 0x06],           // AltGr + C
  ['{', RALT, 0x05],           // AltGr + B
  ['}', RALT, 0x11],           // AltGr + N
  ['[', RALT, 0x09],           // AltGr + F
  [']', RALT, 0x0a],           // AltGr + G
  ['~', RALT, 0x1e],           // AltGr + 1
  ['`', RALT, 0x24],           // AltGr + 7
]

// ============================================================
// Layout registry
// ============================================================

export const KEYBOARD_LAYOUTS: KeyboardLayout[] = [
  buildLayout('us', 'US QWERTY', US_QWERTY_CHARS),
  buildLayout('cs', 'Czech QWERTZ', CZECH_QWERTZ_CHARS),
]

export const DEFAULT_LAYOUT_ID = 'us'
export const LAYOUT_STORAGE_KEY = 'woyta-pad-keyboard-layout'

export function getLayoutById(id: string): KeyboardLayout {
  return KEYBOARD_LAYOUTS.find((layout) => layout.id === id) ?? KEYBOARD_LAYOUTS[0]
}

export function getSelectedLayout(): KeyboardLayout {
  const storedId = localStorage.getItem(LAYOUT_STORAGE_KEY) ?? DEFAULT_LAYOUT_ID
  return getLayoutById(storedId)
}
