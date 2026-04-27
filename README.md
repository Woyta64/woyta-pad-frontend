# Woyta-Pad Configurator

Web-based configurator for the [Woyta-Pad](https://github.com/Woyta64/woyta-pad-firmware) — an RP2040-based macropad. Runs entirely in the browser over WebHID. No drivers, no desktop app.

## Features

- **Keymap editor** — remap keys and encoder actions across multiple layers
- **Macro editor** — create timed sequences, keyboard shortcuts, and text macros
- **Firmware update** — download the latest firmware for your device
- **9 languages** — English, Čeština, Slovenčina, Deutsch, Français, Italiano, Español, 日本語, 한국어

## Requirements

A browser with WebHID support: **Chrome** or **Edge** (desktop). Firefox and Safari are not supported.

### Linux — udev rule

On Linux, Chrome can only access HID devices that are explicitly allowed via a udev rule. Create the file `/etc/udev/rules.d/99-woyta-pad.rules` with:

```
# Woyta-Pad WebHID Access
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", ATTRS{idVendor}=="cafe", ATTRS{idProduct}=="4243", MODE="0666"
```

Then reload udev and re-plug the device:

```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

## Usage

The configurator is hosted at **[launcher.woyta.dev](https://launcher.woyta.dev)** — no installation needed, just open it in Chrome or Edge and connect your device.

## Self-Hosting

If you prefer to run it locally or on your own server:

```bash
pnpm install
pnpm build
```

Then serve the contents of the `dist/` folder with any static file server. For a quick local preview:

```bash
pnpm preview
```

For development with hot reload:

```bash
pnpm dev
```