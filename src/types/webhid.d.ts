// Criteria for filtering devices in the browser picker
interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

// Fired when the device sends data to the browser (device → host)
interface HIDInputReportEvent extends Event {
  device: HIDDevice
  reportId: number
  data: DataView
}

// Fired when a device is physically plugged in or unplugged
interface HIDConnectionEvent extends Event {
  device: HIDDevice
}

// A single HID device — open/close connection and send/receive packets
interface HIDDevice extends EventTarget {
  opened: boolean
  vendorId: number
  productId: number
  productName: string
  collections: { usagePage: number; usage: number }[]
  open(): Promise<void>
  close(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  addEventListener(
    type: 'inputreport',
    listener: (event: HIDInputReportEvent) => void,
  ): void
  removeEventListener(
    type: 'inputreport',
    listener: (event: HIDInputReportEvent) => void,
  ): void
}

// The top-level HID manager exposed on navigator.hid
interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>
  addEventListener(
    type: 'connect' | 'disconnect',
    listener: (event: HIDConnectionEvent) => void,
  ): void
  removeEventListener(
    type: 'connect' | 'disconnect',
    listener: (event: HIDConnectionEvent) => void,
  ): void
}

// Augment the global Navigator so navigator.hid compiles
interface Navigator {
  readonly hid: HID
}
