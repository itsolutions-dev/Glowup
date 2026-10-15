---
"@its/glowup-device": minor
---

Add `@its/glowup-device/bluetooth`: Bluetooth Low Energy as the central (GATT client), on
`react-native-ble-manager` (a new optional peer, loaded on first use: the web and Expo Go read
`unsupported` instead of crashing).

- `useBluetoothState` (the radio, and Android's "turn on Bluetooth?" dialog) and
  `useBluetoothPermission` (Android's nearby devices permissions; on iOS it reads
  `undetermined` until a request in the launch, which shows no UI after the first answer).
- `useBluetoothScan`: one shared scan, service filter, devices listed once with their latest
  signal and advertisement, paused in the background, guarded against Android's five-starts-in-30-
  seconds throttling.
- `useBluetoothDevice`: one shared connection per device with a timeout, service discovery,
  reads, writes (chunked at MTU − 3), MTU, RSSI and bonding (Android); closed when the last
  component using it unmounts unless `disconnectOnUnmount: false`.
- `useBluetoothNotifications`: shared per characteristic, turned on again after every
  reconnection.
- Device Information and Battery helpers, the Nordic UART UUIDs, UTF-8 helpers,
  `toBluetoothUuid`, `BluetoothError`.
- Config plugin key `bluetooth: { permission, neverForLocation }` (through ble-manager's plugin,
  `neverForLocation` defaulting to `true`).
- `/testing`: `createMockBluetoothAdapter()` and `buildBluetoothDevice()`.
