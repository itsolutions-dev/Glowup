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
  href: "/device/info" | "/device/location" | "/device/camera";
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
];

const INSTALL = `npm install @its/glowup-device
# then only the Expo modules of the subpaths you import:
npx expo install expo-device expo-application   # /info
npx expo install expo-location                  # /location
npx expo install expo-camera                    # /camera`;

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
      description="@its/glowup-device is the headless hardware layer beside the kit: device info, location and the camera, each behind an adapter your app can replace. It renders no UI of its own — every page here is built with Glowup components on top of it."
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
        description="The package's config plugin writes the purpose strings and permissions of the capabilities you list, and nothing else: foreground location only, the microphone only with recordAudio."
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
