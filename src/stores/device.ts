import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'

// USB identifiers matching the Woyta Pad firmware descriptor
const VENDOR_ID = 0xcafe
const PRODUCT_ID = 0x4243
const USAGE_PAGE_VENDOR = 0xff60 // Targets Interface 1 (config channel), not Interface 0 (keyboard)
const PACKET_SIZE = 32           // Fixed packet size - matches firmware report descriptor
const CHUNK_PAYLOAD_OFFSET = 2   // Data packets carry payload starting at byte 2
const CHUNK_PAYLOAD_SIZE = PACKET_SIZE - CHUNK_PAYLOAD_OFFSET

// Protocol command bytes
const CMD_DUMMY = 0x00
const CMD_GET_METADATA = 0x01
const CMD_GET_LAYOUT = 0x02
const CMD_GET_KEYMAP = 0x03
const CMD_SET_KEY = 0x04
const CMD_BURST_START = 0x12
const CMD_BURST_END = 0x22

// Set Key uses 0xFF as the row byte to distinguish encoder actions from matrix keys
const ENCODER_ROW_MARKER = 0xff

const LAYOUT_ITEM_SIZE = 5 // [type, x, y, matrixRow, matrixCol]

const RESPONSE_TIMEOUT_MS = 5000

// --- Exported types ---

export interface DeviceMetadata {
  rows: number
  cols: number
  layers: number
  encoders: number
}

export interface LayoutItem {
  type: 'key' | 'encoder'
  x: number
  y: number
  matrixRow: number
  matrixCol: number
}

export interface LayerKeymap {
  keys: number[][]
  encoders: EncoderActions[]
}

export interface EncoderActions {
  ccw: number
  sw: number
  cw: number
}

// Encoder action names used on the frontend, mapped to firmware byte offsets in setEncoderKey
export type EncoderActionName = keyof EncoderActions

interface BurstResponse {
  headerValue: number  // data[1] from the START packet (item count for layout, chunk count for keymap)
  payload: Uint8Array  // reassembled data[2..31] from each data packet
}

// --- Helpers ---

function buildPacket(command: number, payload: number[]): Uint8Array<ArrayBuffer> {
  const buffer = new Uint8Array(new ArrayBuffer(PACKET_SIZE))
  buffer[0] = command
  buffer.set(payload, 1)
  return buffer
}

function readUint16LE(buffer: Uint8Array, offset: number): number {
  return buffer[offset] | (buffer[offset + 1] << 8)
}

// Firmware encodes encoder actions as: 0 = CW, 1 = CCW, 2 = Click
const ENCODER_ACTION_OFFSETS: Record<EncoderActionName, number> = { cw: 0, ccw: 1, sw: 2 }

// --- Store ---

export const useDeviceStore = defineStore('device', () => {
  // shallowRef: avoid deep-proxying browser-native HIDDevice object
  const device = shallowRef<HIDDevice | null>(null)
  const demoMode = ref(false)
  const error = ref<string | null>(null)
  const metadata = ref<DeviceMetadata | null>(null)

  const isConnected = computed(() => demoMode.value || !!device.value?.opened)
  const productName = computed(() => {
    if (demoMode.value) return 'Demo Pad'
    return device.value?.productName ?? null
  })

  let reportHandler: ((data: DataView) => void) | null = null

  function onDisconnect(event: HIDConnectionEvent) {
    if (event.device === device.value) {
      device.value = null
      metadata.value = null
      reportHandler = null
    }
  }

  function onInputReport(event: HIDInputReportEvent) {
    reportHandler?.(event.data)
  }

  // Open browser device picker → open device → register listeners → send Linux sync dummy
  async function connect() {
    error.value = null
    try {
      const [selected] = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID, productId: PRODUCT_ID, usagePage: USAGE_PAGE_VENDOR }],
      })
      if (!selected) return

      if (!selected.opened) await selected.open()

      selected.addEventListener('inputreport', onInputReport)
      navigator.hid.addEventListener('disconnect', onDisconnect)

      device.value = selected

      // Linux toggle-sync: send a dummy packet so the first real command isn't swallowed
      await sendCommand(CMD_DUMMY)
    } catch (connectionError) {
      error.value = connectionError instanceof Error ? connectionError.message : 'Connection failed'
      throw connectionError
    }
  }

  function enterDemoMode() {
    demoMode.value = true
  }

  async function disconnect() {
    if (demoMode.value) {
      demoMode.value = false
      return
    }

    const currentDevice = device.value
    if (!currentDevice) return

    currentDevice.removeEventListener('inputreport', onInputReport)
    navigator.hid.removeEventListener('disconnect', onDisconnect)
    device.value = null
    metadata.value = null
    reportHandler = null

    if (currentDevice.opened) await currentDevice.close()
  }

  // Build a 32-byte packet (byte 0 = command, rest = payload) and send to device
  async function sendCommand(command: number, payload: number[] = []) {
    if (!device.value?.opened) throw new Error('Device not connected')
    await device.value.sendReport(0, buildPacket(command, payload))
  }

  // Single-packet request -> single-packet response (used by metadata)
  async function sendRequest(command: number, payload: number[] = []): Promise<DataView> {
    if (!device.value?.opened) throw new Error('Device not connected')

    return new Promise<DataView>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reportHandler = null
        reject(new Error(`Response timeout for command 0x${command.toString(16).padStart(2, '0')}`))
      }, RESPONSE_TIMEOUT_MS)

      reportHandler = (data) => {
        clearTimeout(timeout)
        reportHandler = null
        resolve(data)
      }

      device.value!.sendReport(0, buildPacket(command, payload)).catch((sendError) => {
        clearTimeout(timeout)
        reportHandler = null
        reject(sendError)
      })
    })
  }

  // Burst request: sends command, then collects START(0x12) -> N data packets -> END(0x22).
  // Returns the reassembled payload (concatenated data[2..31] from each data packet).
  async function sendBurstRequest(command: number, payload: number[] = []): Promise<BurstResponse> {
    if (!device.value?.opened) throw new Error('Device not connected')

    return new Promise<BurstResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reportHandler = null
        reject(new Error(`Burst timeout for command 0x${command.toString(16).padStart(2, '0')}`))
      }, RESPONSE_TIMEOUT_MS)

      const chunks: Uint8Array[] = []
      let headerValue = 0

      reportHandler = (data) => {
        const responseByte = data.getUint8(0)

        if (responseByte === CMD_BURST_START) {
          headerValue = data.getUint8(1)
          return
        }

        if (responseByte === CMD_BURST_END) {
          clearTimeout(timeout)
          reportHandler = null

          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          const reassembled = new Uint8Array(totalLength)
          let writeOffset = 0
          for (const chunk of chunks) {
            reassembled.set(chunk, writeOffset)
            writeOffset += chunk.length
          }

          resolve({ headerValue, payload: reassembled })
          return
        }

        if (responseByte === command) {
          const chunkData = new Uint8Array(CHUNK_PAYLOAD_SIZE)
          for (let byteIndex = 0; byteIndex < CHUNK_PAYLOAD_SIZE; byteIndex++) {
            chunkData[byteIndex] = data.getUint8(byteIndex + CHUNK_PAYLOAD_OFFSET)
          }
          chunks.push(chunkData)
        }
      }

      device.value!.sendReport(0, buildPacket(command, payload)).catch((sendError) => {
        clearTimeout(timeout)
        reportHandler = null
        reject(sendError)
      })
    })
  }

  // --- Protocol commands ---

  // 0x01 - Metadata (single-packet response)
  // Response: [0x01, rows, cols, layers, encoders]
  async function requestMetadata(): Promise<DeviceMetadata> {
    const response = await sendRequest(CMD_GET_METADATA)
    const result: DeviceMetadata = {
      rows: response.getUint8(1),
      cols: response.getUint8(2),
      layers: response.getUint8(3),
      encoders: response.getUint8(4),
    }
    metadata.value = result
    return result
  }

  // 0x02 - Layout (burst response)
  // Each 5-byte item: [type(0=key, 1=encoder), x, y, matrixRow, matrixCol]
  async function requestLayout(): Promise<LayoutItem[]> {
    const { headerValue: itemCount, payload } = await sendBurstRequest(CMD_GET_LAYOUT)

    const items: LayoutItem[] = []
    for (let index = 0; index < itemCount; index++) {
      const offset = index * LAYOUT_ITEM_SIZE
      items.push({
        type: payload[offset] === 1 ? 'encoder' : 'key',
        x: payload[offset + 1],
        y: payload[offset + 2],
        matrixRow: payload[offset + 3],
        matrixCol: payload[offset + 4],
      })
    }

    return items
  }

  // 0x03 - Keymap per layer (burst response)
  // Reassembled buffer layout:
  //   Matrix keys:     rows x cols x 2 bytes (uint16 LE per keycode)
  //   Encoder actions: encoders x 3 x 2 bytes (CW, CCW, Click - uint16 LE each)
  async function requestKeymap(layerIndex: number): Promise<LayerKeymap> {
    if (!metadata.value) throw new Error('Metadata not loaded - call requestMetadata() first')

    const { rows, cols, encoders: encoderCount } = metadata.value
    const { payload } = await sendBurstRequest(CMD_GET_KEYMAP, [layerIndex])

    const keys: number[][] = []
    let offset = 0
    for (let row = 0; row < rows; row++) {
      const rowKeycodes: number[] = []
      for (let col = 0; col < cols; col++) {
        rowKeycodes.push(readUint16LE(payload, offset))
        offset += 2
      }
      keys.push(rowKeycodes)
    }

    // Firmware order per encoder: CW, CCW, Click - mapped to cw, ccw, sw
    const encoderActions: EncoderActions[] = []
    for (let encoderIndex = 0; encoderIndex < encoderCount; encoderIndex++) {
      const cw = readUint16LE(payload, offset)
      offset += 2
      const ccw = readUint16LE(payload, offset)
      offset += 2
      const sw = readUint16LE(payload, offset)
      offset += 2
      encoderActions.push({ ccw, sw, cw })
    }

    return { keys, encoders: encoderActions }
  }

  // 0x04 - Set a single matrix key
  // Packet: [0x04, layer, row, col, keycodeLo, keycodeHi]
  async function setMatrixKey(layer: number, row: number, col: number, keycode: number) {
    await sendCommand(CMD_SET_KEY, [layer, row, col, keycode & 0xff, (keycode >> 8) & 0xff])
  }

  // 0x04 - Set a single encoder action
  // Packet: [0x04, layer, 0xFF, encoderIndex*3 + actionOffset, keycodeLo, keycodeHi]
  async function setEncoderKey(layer: number, encoderIndex: number, action: EncoderActionName, keycode: number) {
    // Each encoder owns 3 consecutive col slots (CW, CCW, Click)
    const colByte = encoderIndex * 3 + ENCODER_ACTION_OFFSETS[action]
    await sendCommand(CMD_SET_KEY, [layer, ENCODER_ROW_MARKER, colByte, keycode & 0xff, (keycode >> 8) & 0xff])
  }

  return {
    device, demoMode, error, metadata,
    isConnected, productName,
    connect, disconnect, enterDemoMode,
    requestMetadata, requestLayout, requestKeymap,
    setMatrixKey, setEncoderKey,
  }
})