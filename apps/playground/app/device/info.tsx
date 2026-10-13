import { Platform } from "react-native";
import {
  Banner,
  ListItem,
  ListSection,
  ListSubheader,
  StatusBadge,
} from "@its/glowup-ui";
import { useDeviceInfo, type DeviceInfo } from "@its/glowup-device/info";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const USAGE = `import { useDeviceInfo } from "@its/glowup-device/info";

function About() {
  const { model, os, deviceType, isEmulator, app } = useDeviceInfo();
  return (
    <ListItem secondary={\`\${os.name} \${os.version} · \${deviceType}\`}>
      {\`\${model ?? "Unknown device"} — v\${app.version} (\${app.build})\`}
    </ListItem>
  );
}`;

const shown = (value: string | null) => value ?? "—";

const GROUPS: {
  title: string;
  rows: { label: string; value: (info: DeviceInfo) => string }[];
}[] = [
  {
    title: "Device",
    rows: [
      { label: "Model", value: (info) => shown(info.model) },
      { label: "Brand", value: (info) => shown(info.brand) },
      { label: "Manufacturer", value: (info) => shown(info.manufacturer) },
      { label: "Type", value: (info) => info.deviceType },
    ],
  },
  {
    title: "System",
    rows: [
      { label: "Platform", value: (info) => info.platform },
      { label: "OS", value: (info) => shown(info.os.name) },
      { label: "OS version", value: (info) => shown(info.os.version) },
    ],
  },
  {
    title: "App",
    rows: [
      { label: "Identifier", value: (info) => shown(info.app.id) },
      { label: "Name", value: (info) => shown(info.app.name) },
      { label: "Version", value: (info) => shown(info.app.version) },
      { label: "Build", value: (info) => shown(info.app.build) },
    ],
  },
];

export default function DeviceInfoPage() {
  const info = useDeviceInfo();

  return (
    <Page
      eyebrow="@its/glowup-device/info"
      title="Device info"
      description="What the app can know about the device it runs on, read once through useDeviceInfo(). Every value the platform cannot answer is null, shown here as a dash."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser, model and OS come from the user agent and there is no native app: brand and the app fields stay empty. This page was prerendered with every field unknown and filled in after hydration."
              : "In Expo Go the App fields describe Expo Go itself, not this app; a development build shows the playground's own."
          }
        />
      }
    >
      <Section title="This device">
        <ListSection>
          <ListItem
            trailing={
              <StatusBadge
                label={info.isEmulator ? "Emulator" : "Real device"}
                type={info.isEmulator ? "warning" : "success"}
              />
            }
          >
            Hardware
          </ListItem>
          {GROUPS.map((group) => [
            <ListSubheader key={group.title}>{group.title}</ListSubheader>,
            ...group.rows.map((row) => (
              <ListItem key={row.label} secondary={row.value(info)}>
                {row.label}
              </ListItem>
            )),
          ])}
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="Synchronous and stable: the values are constants the OS fixes at launch, so there is no loading state on native."
      >
        <CodeBlock
          code="npx expo install expo-device expo-application @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="About.tsx" />
      </Section>
    </Page>
  );
}
