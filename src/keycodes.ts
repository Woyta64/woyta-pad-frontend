/**
 * Keycode definitions matching woyta-pad-fw/core/keycodes.h
 * Each entry maps a numeric HID keycode to a display label.
 */

import { getSelectedLayout } from '@/keyboardLayouts'

export interface Keycode {
  code: number
  label: string
}

// --- Individual keycodes ---

// Custom
export const KC_TRNS: Keycode       = { code: 0x00, label: 'TRNS' }
export const KC_LAY_NEXT: Keycode   = { code: 0x00fc, label: 'LY NXT' }

// Letters
export const KC_A: Keycode = { code: 0x04, label: 'A' }
export const KC_B: Keycode = { code: 0x05, label: 'B' }
export const KC_C: Keycode = { code: 0x06, label: 'C' }
export const KC_D: Keycode = { code: 0x07, label: 'D' }
export const KC_E: Keycode = { code: 0x08, label: 'E' }
export const KC_F: Keycode = { code: 0x09, label: 'F' }
export const KC_G: Keycode = { code: 0x0a, label: 'G' }
export const KC_H: Keycode = { code: 0x0b, label: 'H' }
export const KC_I: Keycode = { code: 0x0c, label: 'I' }
export const KC_J: Keycode = { code: 0x0d, label: 'J' }
export const KC_K: Keycode = { code: 0x0e, label: 'K' }
export const KC_L: Keycode = { code: 0x0f, label: 'L' }
export const KC_M: Keycode = { code: 0x10, label: 'M' }
export const KC_N: Keycode = { code: 0x11, label: 'N' }
export const KC_O: Keycode = { code: 0x12, label: 'O' }
export const KC_P: Keycode = { code: 0x13, label: 'P' }
export const KC_Q: Keycode = { code: 0x14, label: 'Q' }
export const KC_R: Keycode = { code: 0x15, label: 'R' }
export const KC_S: Keycode = { code: 0x16, label: 'S' }
export const KC_T: Keycode = { code: 0x17, label: 'T' }
export const KC_U: Keycode = { code: 0x18, label: 'U' }
export const KC_V: Keycode = { code: 0x19, label: 'V' }
export const KC_W: Keycode = { code: 0x1a, label: 'W' }
export const KC_X: Keycode = { code: 0x1b, label: 'X' }
export const KC_Y: Keycode = { code: 0x1c, label: 'Y' }
export const KC_Z: Keycode = { code: 0x1d, label: 'Z' }

// Numbers
export const KC_1: Keycode = { code: 0x1e, label: '1' }
export const KC_2: Keycode = { code: 0x1f, label: '2' }
export const KC_3: Keycode = { code: 0x20, label: '3' }
export const KC_4: Keycode = { code: 0x21, label: '4' }
export const KC_5: Keycode = { code: 0x22, label: '5' }
export const KC_6: Keycode = { code: 0x23, label: '6' }
export const KC_7: Keycode = { code: 0x24, label: '7' }
export const KC_8: Keycode = { code: 0x25, label: '8' }
export const KC_9: Keycode = { code: 0x26, label: '9' }
export const KC_0: Keycode = { code: 0x27, label: '0' }

// Special keys
export const KC_ENTER: Keycode      = { code: 0x28, label: 'Enter' }
export const KC_ESC: Keycode        = { code: 0x29, label: 'Esc' }
export const KC_BACKSPACE: Keycode  = { code: 0x2a, label: 'Bksp' }
export const KC_TAB: Keycode        = { code: 0x2b, label: 'Tab' }
export const KC_SPACE: Keycode      = { code: 0x2c, label: 'Space' }
export const KC_MINUS: Keycode      = { code: 0x2d, label: '-' }
export const KC_EQUAL: Keycode      = { code: 0x2e, label: '=' }
export const KC_LEFTBRACE: Keycode  = { code: 0x2f, label: '[' }
export const KC_RIGHTBRACE: Keycode = { code: 0x30, label: ']' }
export const KC_BACKSLASH: Keycode  = { code: 0x31, label: '\\' }
export const KC_HASHTILDE: Keycode  = { code: 0x32, label: '#~' }
export const KC_SEMICOLON: Keycode  = { code: 0x33, label: ';' }
export const KC_APOSTROPHE: Keycode = { code: 0x34, label: '\'' }
export const KC_GRAVE: Keycode      = { code: 0x35, label: '`' }
export const KC_COMMA: Keycode      = { code: 0x36, label: ',' }
export const KC_DOT: Keycode        = { code: 0x37, label: '.' }
export const KC_SLASH: Keycode      = { code: 0x38, label: '/' }
export const KC_CAPSLOCK: Keycode   = { code: 0x39, label: 'Caps' }

// Function keys
export const KC_F1: Keycode  = { code: 0x3a, label: 'F1' }
export const KC_F2: Keycode  = { code: 0x3b, label: 'F2' }
export const KC_F3: Keycode  = { code: 0x3c, label: 'F3' }
export const KC_F4: Keycode  = { code: 0x3d, label: 'F4' }
export const KC_F5: Keycode  = { code: 0x3e, label: 'F5' }
export const KC_F6: Keycode  = { code: 0x3f, label: 'F6' }
export const KC_F7: Keycode  = { code: 0x40, label: 'F7' }
export const KC_F8: Keycode  = { code: 0x41, label: 'F8' }
export const KC_F9: Keycode  = { code: 0x42, label: 'F9' }
export const KC_F10: Keycode = { code: 0x43, label: 'F10' }
export const KC_F11: Keycode = { code: 0x44, label: 'F11' }
export const KC_F12: Keycode = { code: 0x45, label: 'F12' }
export const KC_F13: Keycode = { code: 0x68, label: 'F13' }
export const KC_F14: Keycode = { code: 0x69, label: 'F14' }
export const KC_F15: Keycode = { code: 0x6a, label: 'F15' }
export const KC_F16: Keycode = { code: 0x6b, label: 'F16' }
export const KC_F17: Keycode = { code: 0x6c, label: 'F17' }
export const KC_F18: Keycode = { code: 0x6d, label: 'F18' }
export const KC_F19: Keycode = { code: 0x6e, label: 'F19' }
export const KC_F20: Keycode = { code: 0x6f, label: 'F20' }
export const KC_F21: Keycode = { code: 0x70, label: 'F21' }
export const KC_F22: Keycode = { code: 0x71, label: 'F22' }
export const KC_F23: Keycode = { code: 0x72, label: 'F23' }
export const KC_F24: Keycode = { code: 0x73, label: 'F24' }

// Navigation
export const KC_SYSRQ: Keycode      = { code: 0x46, label: 'PrtSc' }
export const KC_SCROLLLOCK: Keycode  = { code: 0x47, label: 'ScrLk' }
export const KC_PAUSE: Keycode      = { code: 0x48, label: 'Pause' }
export const KC_INSERT: Keycode     = { code: 0x49, label: 'Ins' }
export const KC_HOME: Keycode       = { code: 0x4a, label: 'Home' }
export const KC_PAGEUP: Keycode     = { code: 0x4b, label: 'PgUp' }
export const KC_DELETE: Keycode     = { code: 0x4c, label: 'Del' }
export const KC_END: Keycode        = { code: 0x4d, label: 'End' }
export const KC_PAGEDOWN: Keycode   = { code: 0x4e, label: 'PgDn' }
export const KC_RIGHT: Keycode      = { code: 0x4f, label: 'Right' }
export const KC_LEFT: Keycode       = { code: 0x50, label: 'Left' }
export const KC_DOWN: Keycode       = { code: 0x51, label: 'Down' }
export const KC_UP: Keycode         = { code: 0x52, label: 'Up' }

// Numpad
export const KC_NUMLOCK: Keycode    = { code: 0x53, label: 'Num' }
export const KC_KPSLASH: Keycode    = { code: 0x54, label: 'KP /' }
export const KC_KPASTERISK: Keycode = { code: 0x55, label: 'KP *' }
export const KC_KPMINUS: Keycode    = { code: 0x56, label: 'KP -' }
export const KC_KPPLUS: Keycode     = { code: 0x57, label: 'KP +' }
export const KC_KPENTER: Keycode    = { code: 0x58, label: 'KP Ent' }
export const KC_KP1: Keycode        = { code: 0x59, label: 'KP 1' }
export const KC_KP2: Keycode        = { code: 0x5a, label: 'KP 2' }
export const KC_KP3: Keycode        = { code: 0x5b, label: 'KP 3' }
export const KC_KP4: Keycode        = { code: 0x5c, label: 'KP 4' }
export const KC_KP5: Keycode        = { code: 0x5d, label: 'KP 5' }
export const KC_KP6: Keycode        = { code: 0x5e, label: 'KP 6' }
export const KC_KP7: Keycode        = { code: 0x5f, label: 'KP 7' }
export const KC_KP8: Keycode        = { code: 0x60, label: 'KP 8' }
export const KC_KP9: Keycode        = { code: 0x61, label: 'KP 9' }
export const KC_KP0: Keycode        = { code: 0x62, label: 'KP 0' }
export const KC_KPDOT: Keycode      = { code: 0x63, label: 'KP .' }

// Modifiers
export const KC_LEFTCTRL: Keycode   = { code: 0xe0, label: 'LCtrl' }
export const KC_LEFTSHIFT: Keycode  = { code: 0xe1, label: 'LShift' }
export const KC_LEFTALT: Keycode    = { code: 0xe2, label: 'LAlt' }
export const KC_LEFTMETA: Keycode   = { code: 0xe3, label: 'Super' }
export const KC_RIGHTCTRL: Keycode  = { code: 0xe4, label: 'RCtrl' }
export const KC_RIGHTSHIFT: Keycode = { code: 0xe5, label: 'RShift' }
export const KC_RIGHTALT: Keycode   = { code: 0xe6, label: 'RAlt' }
export const KC_RIGHTMETA: Keycode  = { code: 0xe7, label: 'RSuper' }

// Media
export const KC_MEDIA_PLAYPAUSE: Keycode     = { code: 0xe8, label: 'Play' }
export const KC_MEDIA_STOPCD: Keycode        = { code: 0xe9, label: 'Stop' }
export const KC_MEDIA_PREVIOUSSONG: Keycode  = { code: 0xea, label: 'Prev' }
export const KC_MEDIA_NEXTSONG: Keycode      = { code: 0xeb, label: 'Next' }
export const KC_MEDIA_EJECTCD: Keycode       = { code: 0xec, label: 'Eject' }
export const KC_MEDIA_VOLUMEUP: Keycode      = { code: 0xed, label: 'Vol+' }
export const KC_MEDIA_VOLUMEDOWN: Keycode    = { code: 0xee, label: 'Vol-' }
export const KC_MEDIA_MUTE: Keycode          = { code: 0xef, label: 'Mute' }
export const KC_MEDIA_WWW: Keycode           = { code: 0xf0, label: 'WWW' }
export const KC_MEDIA_BACK: Keycode          = { code: 0xf1, label: 'Back' }
export const KC_MEDIA_FORWARD: Keycode       = { code: 0xf2, label: 'Fwd' }
export const KC_MEDIA_STOP: Keycode          = { code: 0xf3, label: 'MStop' }
export const KC_MEDIA_SCROLLUP: Keycode      = { code: 0xf5, label: 'ScrUp' }
export const KC_MEDIA_SCROLLDOWN: Keycode    = { code: 0xf6, label: 'ScrDn' }
export const KC_MEDIA_SLEEP: Keycode         = { code: 0xf8, label: 'Sleep' }
export const KC_MEDIA_REFRESH: Keycode       = { code: 0xfa, label: 'Rfrsh' }
export const KC_MEDIA_CALC: Keycode          = { code: 0xfb, label: 'Calc' }

// Misc
export const KC_102ND: Keycode   = { code: 0x64, label: '\\|' }
export const KC_COMPOSE: Keycode = { code: 0x65, label: 'Menu' }
export const KC_POWER: Keycode   = { code: 0x66, label: 'Power' }

// --- Macros (0x0100–0x017F) ---
export const MACRO_KEYS: Keycode[] = Array.from({ length: 128 }, (_, i) => ({
  code: 0x0100 + i,
  label: `M${i + 1}`,
}))

// --- Palette categories ---

export interface KeycodeCategory {
  id: string
  label: string
  keys: Keycode[]
}

export const KEYCODE_CATEGORIES: KeycodeCategory[] = [
  {
    id: 'basic',
    label: 'Basic',
    keys: [
      KC_ESC,
      KC_A, KC_B, KC_C, KC_D, KC_E, KC_F, KC_G, KC_H, KC_I, KC_J, KC_K, KC_L, KC_M,
      KC_N, KC_O, KC_P, KC_Q, KC_R, KC_S, KC_T, KC_U, KC_V, KC_W, KC_X, KC_Y, KC_Z,
      KC_1, KC_2, KC_3, KC_4, KC_5, KC_6, KC_7, KC_8, KC_9, KC_0,
      KC_ENTER, KC_TAB, KC_SPACE, KC_BACKSPACE, KC_DELETE,
      KC_MINUS, KC_EQUAL, KC_LEFTBRACE, KC_RIGHTBRACE, KC_BACKSLASH,
      KC_SEMICOLON, KC_APOSTROPHE, KC_GRAVE, KC_COMMA, KC_DOT, KC_SLASH,
      KC_CAPSLOCK,
    ],
  },
  {
    id: 'mod',
    label: 'Modifiers',
    keys: [
      KC_LEFTSHIFT, KC_LEFTCTRL, KC_LEFTALT, KC_LEFTMETA,
      KC_RIGHTSHIFT, KC_RIGHTCTRL, KC_RIGHTALT, KC_RIGHTMETA,
    ],
  },
  {
    id: 'nav',
    label: 'Navigation',
    keys: [
      KC_UP, KC_DOWN, KC_LEFT, KC_RIGHT,
      KC_HOME, KC_END, KC_PAGEUP, KC_PAGEDOWN,
      KC_INSERT, KC_SYSRQ, KC_SCROLLLOCK, KC_PAUSE,
    ],
  },
  {
    id: 'fn',
    label: 'Function',
    keys: [
      KC_F1, KC_F2, KC_F3, KC_F4, KC_F5, KC_F6,
      KC_F7, KC_F8, KC_F9, KC_F10, KC_F11, KC_F12,
      KC_F13, KC_F14, KC_F15, KC_F16, KC_F17, KC_F18,
      KC_F19, KC_F20, KC_F21, KC_F22, KC_F23, KC_F24,
    ],
  },
  {
    id: 'numpad',
    label: 'Numpad',
    keys: [
      KC_NUMLOCK, KC_KPSLASH, KC_KPASTERISK, KC_KPMINUS, KC_KPPLUS, KC_KPENTER,
      KC_KP7, KC_KP8, KC_KP9, KC_KP4, KC_KP5, KC_KP6, KC_KP1, KC_KP2, KC_KP3,
      KC_KP0, KC_KPDOT,
    ],
  },
  {
    id: 'media',
    label: 'Media',
    keys: [
      KC_MEDIA_PLAYPAUSE, KC_MEDIA_STOPCD, KC_MEDIA_NEXTSONG, KC_MEDIA_PREVIOUSSONG,
      KC_MEDIA_VOLUMEUP, KC_MEDIA_VOLUMEDOWN, KC_MEDIA_MUTE,
      KC_MEDIA_WWW, KC_MEDIA_BACK, KC_MEDIA_FORWARD,
      KC_MEDIA_SCROLLUP, KC_MEDIA_SCROLLDOWN,
      KC_MEDIA_SLEEP, KC_MEDIA_REFRESH, KC_MEDIA_CALC,
    ],
  },
  {
    id: 'macro',
    label: 'Macros',
    keys: MACRO_KEYS,
  },
  {
    id: 'custom',
    label: 'Custom',
    keys: [KC_TRNS, KC_LAY_NEXT, KC_COMPOSE, KC_POWER],
  },
]

// --- Lookup: code → Keycode ---
// Pre-built map for O(1) label lookups used by the keymap grid renderer.

const allKeycodes: Keycode[] = KEYCODE_CATEGORIES.flatMap((c) => c.keys)

const codeToKeycode = new Map<number, Keycode>(allKeycodes.map((kc) => [kc.code, kc]))

/** Get the display label for a keycode number, using selected keyboard layout for basic keys. */
export function keycodeLabel(code: number): string {
  if ((code >= 0x04 && code <= 0x38) || code === 0x64) {
    const layoutChar = getSelectedLayout().hidToChar.get(`0:${code}`)
    if (layoutChar && layoutChar.trim().length > 0) {
      return layoutChar.length === 1 ? layoutChar.toUpperCase() : layoutChar
    }
  }
  return codeToKeycode.get(code)?.label ?? `0x${code.toString(16).padStart(2, '0').toUpperCase()}`
}
