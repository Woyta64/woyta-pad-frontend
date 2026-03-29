import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'

// USB identifiers matching the Woyta Pad firmware descriptor
const VENDOR_ID = 0xcafe
const PRODUCT_ID = 0x4243
const USAGE_PAGE_VENDOR = 0xff60 // Targets Interface 1 (config channel), not Interface 0 (keyboard)
const PACKET_SIZE = 32           // Fixed packet size — matches firmware report descriptor

export const useDeviceStore = defineStore('device', () => {
  // shallowRef: avoid deep-proxying browser-native HIDDevice object
  const device = shallowRef<HIDDevice | null>(null)
  const demoMode = ref(false)
  const error = ref<string | null>(null)

  const isConnected = computed(() => demoMode.value || !!device.value?.opened)
  const productName = computed(() => {
    if (demoMode.value) return 'Demo Pad'
    return device.value?.productName ?? null
  })

  // Clear device ref when the user physically unplugs
  function onDisconnect(ev: HIDConnectionEvent) {
    if (ev.device === device.value) {
      device.value = null
    }
  }

  function onInputReport(_ev: HIDInputReportEvent) {
    // Protocol handling will be added later
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
      await sendCommand(0x00)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Connection failed'
      throw e
    }
  }

  function enterDemoMode() {
    demoMode.value = true
  }

  // Clean teardown: remove listeners, null ref, close OS handle
  async function disconnect() {
    if (demoMode.value) {
      demoMode.value = false
      return
    }

    const dev = device.value
    if (!dev) return

    dev.removeEventListener('inputreport', onInputReport)
    navigator.hid.removeEventListener('disconnect', onDisconnect)
    device.value = null

    if (dev.opened) await dev.close()
  }

  // Build a 32-byte packet (byte 0 = command, rest = payload) and send to device
  async function sendCommand(command: number, payload: number[] = []) {
    if (!device.value?.opened) throw new Error('Device not connected')

    const buf = new Uint8Array(PACKET_SIZE)
    buf[0] = command
    for (let i = 0; i < payload.length; i++) buf[i + 1] = payload[i]

    await device.value.sendReport(0, buf)
  }

  return { device, demoMode, error, isConnected, productName, connect, disconnect, enterDemoMode, sendCommand }
})
