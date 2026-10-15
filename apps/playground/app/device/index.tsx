import { useRouter } from "expo-router";
import {
  Icon,
  ListItem,
  ListSection,
  useTheme,
  type MaterialCommunityIconsGlyphs,
} from "@its/glowup-ui";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const CAPABILITIES: {
  href:
    | "/device/info"
    | "/device/location"
    | "/device/camera"
    | "/device/network"
    | "/device/battery"
    | "/device/keep-awake"
    | "/device/orientation"
    | "/device/haptics"
    | "/device/biometrics"
    | "/device/secure-store"
    | "/device/sensors"
    | "/device/media-picker"
    | "/device/media-library"
    | "/device/background-location"
    | "/device/bluetooth";
  icon: MaterialCommunityIconsGlyphs;
  title: string;
  summary: string;
}[] = [
  {
    href: "/device/info",
    icon: "cellphone-information",
    title: "Device info",
    summary:
      "Model, OS, device type, emulator, app version and build — @its/glowup-device/info",
  },
  {
    href: "/device/location",
    icon: "map-marker-outline",
    title: "Location",
    summary:
      "Permission with precision, one position, a live watch — @its/glowup-device/location",
  },
  {
    href: "/device/camera",
    icon: "camera-outline",
    title: "Camera",
    summary:
      "Preview, photos, video and QR scanning, with a Material camera recipe — @its/glowup-device/camera",
  },
  {
    href: "/device/network",
    icon: "wifi",
    title: "Network",
    summary:
      "Online, internet reachable, type and metered, kept live — @its/glowup-device/network",
  },
  {
    href: "/device/battery",
    icon: "battery-charging-outline",
    title: "Battery",
    summary:
      "Level, charging state and Low Power Mode, kept live — @its/glowup-device/battery",
  },
  {
    href: "/device/keep-awake",
    icon: "monitor-eye",
    title: "Keep awake",
    summary:
      "Hold the screen on while a component is mounted — @its/glowup-device/keep-awake",
  },
  {
    href: "/device/orientation",
    icon: "phone-rotate-landscape",
    title: "Orientation",
    summary:
      "The interface orientation, live, and stacked locks — @its/glowup-device/orientation",
  },
  {
    href: "/device/haptics",
    icon: "vibrate",
    title: "Haptics",
    summary:
      "Haptic feedback, wired into every Glowup control — @its/glowup-device/haptics",
  },
  {
    href: "/device/biometrics",
    icon: "fingerprint",
    title: "Biometrics",
    summary:
      "A local gate with fingerprint, face or passcode, and an app lock — @its/glowup-device/biometrics",
  },
  {
    href: "/device/secure-store",
    icon: "shield-key-outline",
    title: "Secure store",
    summary:
      "Secrets in the Keychain / Keystore, plain or bound to biometrics — @its/glowup-device/secure-store",
  },
  {
    href: "/device/sensors",
    icon: "axis-arrow",
    title: "Sensors",
    summary:
      "Accelerometer, gyroscope, magnetometer, barometer, light, device motion and how it is held — @its/glowup-device/sensors",
  },
  {
    href: "/device/media-picker",
    icon: "image-multiple-outline",
    title: "Media picker",
    summary:
      "The system photo and video picker, no permission needed — @its/glowup-device/media-picker",
  },
  {
    href: "/device/media-library",
    icon: "folder-image",
    title: "Media library",
    summary:
      "Save photos and videos to the library with the least permission — @its/glowup-device/media-library",
  },
  {
    href: "/device/background-location",
    icon: "map-marker-path",
    title: "Background location",
    summary:
      "Positions with the app in the background, and geofencing, delivered to tasks — @its/glowup-device/background-location",
  },
  {
    href: "/device/bluetooth",
    icon: "bluetooth",
    title: "Bluetooth",
    summary:
      "Bluetooth Low Energy: scan, connect, read, write and notifications — @its/glowup-device/bluetooth",
  },
];

const INSTALL = `npm install @its/glowup-device
# then only the Expo modules of the subpaths you import:
npx expo install expo-device expo-application   # /info
npx expo install expo-location                  # /location
npx expo install expo-camera                    # /camera
npx expo install @react-native-community/netinfo # /network
npx expo install expo-battery                   # /battery
npx expo install expo-keep-awake                # /keep-awake
npx expo install expo-screen-orientation        # /orientation
npx expo install expo-haptics                   # /haptics
npx expo install expo-local-authentication      # /biometrics
npx expo install expo-secure-store              # /secure-store
npx expo install expo-sensors                   # /sensors
npx expo install expo-image-picker              # /media-picker
npx expo install expo-media-library             # /media-library
npx expo install expo-location expo-task-manager # /background-location
npx expo install react-native-ble-manager       # /bluetooth`;

const PLUGIN = `// app.config.ts — configures only what you list
plugins: [
  [
    "@its/glowup-device",
    {
      location: { whenInUsePermission: "Shows the shops near you." },
      camera: {
        cameraPermission: "Scans the QR code on your ticket.",
        microphonePermission: "Records your voice in video reviews.",
        recordAudio: true, // omit it if videos need no sound
      },
      biometrics: { faceIDPermission: "Unlocks your saved cards." },
      secureStore: true,
      sensors: { motionPermission: "Counts the floors you climb." },
      mediaPicker: true,
      mediaLibrary: { savePermission: "Saves your edited photos." },
      backgroundLocation: {
        geofencing: true,
        alwaysPermission: "Records your trip while the app is closed.",
      },
      bluetooth: { permission: "Reads your heart rate monitor." },
    },
  ],
],`;

const ADAPTERS = `import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  createMockCameraAdapter,
  createMockLocationAdapter,
} from "@its/glowup-device/testing";

// In a test: no hardware, no jest.mock of Expo modules.
const location = createMockLocationAdapter({ permission: "granted" });
render(
  <DeviceAdaptersProvider adapters={{ location, camera: createMockCameraAdapter() }}>
    <Screen />
  </DeviceAdaptersProvider>,
);
location.emit(buildPosition({ latitude: 45.46, longitude: 9.19 }));`;

export default function DeviceOverview() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Page
      eyebrow="Companion package"
      title="Device"
      description="@its/glowup-device is the headless hardware layer beside the kit: device info, location, the camera, network, battery, keep-awake, orientation, haptics, biometrics, a secure store, the motion sensors, the photo library, background location with geofencing and Bluetooth Low Energy, each behind an adapter your app can replace. It renders no UI of its own — every page here is built with Glowup components on top of it."
    >
      <Section
        title="Capabilities"
        description="One subpath each, so an app installs only the Expo modules of the capabilities it imports."
      >
        <ListSection>
          {CAPABILITIES.map((capability) => (
            <ListItem
              key={capability.href}
              onPress={() => router.push(capability.href)}
              leading={
                <Icon
                  source={capability.icon}
                  size={24}
                  color={theme.colors.primary}
                />
              }
              trailing={
                <Icon
                  source="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              }
              secondary={capability.summary}
            >
              {capability.title}
            </ListItem>
          ))}
        </ListSection>
      </Section>

      <Section
        title="Install"
        description="The package's config plugin writes the purpose strings and permissions of the capabilities you list, and nothing else: foreground location only, the microphone only with recordAudio, no activity recognition for the sensors, no media read permission for the library."
      >
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
        <CodeBlock code={PLUGIN} title="app.config.ts" />
      </Section>

      <Section
        title="Adapters and tests"
        description="Hooks and CameraView talk to an adapter, never to Expo directly. The Expo one is the default; DeviceAdaptersProvider swaps any of them for a subtree — in tests, for the in-memory adapters of @its/glowup-device/testing."
      >
        <CodeBlock code={ADAPTERS} title="Screen.test.tsx" />
      </Section>
    </Page>
  );
}
