import { useState } from "react";
import { Platform } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Banner,
  ListItem,
  ListSection,
  StatusBadge,
  Switch,
} from "@its/glowup-ui";
import {
  useKeepAwake,
  useKeepAwakeSupport,
} from "@its/glowup-device/keep-awake";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const USAGE = `import { useKeepAwake } from "@its/glowup-device/keep-awake";

function ScannerScreen() {
  useKeepAwake(); // the screen stays on while this is mounted
  return <CameraView mode="scan" />;
}

function Upload({ busy }: { busy: boolean }) {
  useKeepAwake({ enabled: busy }); // only while the upload runs
  return <LinearProgress indeterminate={busy} />;
}`;

export default function KeepAwakePage() {
  const supported = useKeepAwakeSupport();
  const [wanted, setWanted] = useState(false);
  // A page left in the stack stays mounted: hold the screen only while it is
  // the one on screen.
  const focused = useIsFocused();
  const holding = wanted && focused && supported;
  useKeepAwake({ enabled: holding });

  return (
    <Page
      eyebrow="@its/glowup-device/keep-awake"
      title="Keep awake"
      description="Keep the screen on while a component is mounted and enabled. Each hook holds its own tag, so the screen sleeps again only once the last one lets go."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser this is a Screen Wake Lock (HTTPS only). The browser drops it whenever the tab is hidden; the package takes it again when the tab shows."
              : "Turn it on, put the phone down and wait past your auto-lock time: the screen stays on until you turn it off or leave the page."
          }
        />
      }
    >
      <Section title="Try it">
        <ListSection>
          <ListItem
            secondary={
              supported
                ? "useKeepAwake({ enabled }) while this page is focused."
                : "This browser has no Screen Wake Lock."
            }
            trailing={
              <Switch
                value={wanted && supported}
                disabled={!supported}
                onChange={setWanted}
              />
            }
          >
            Keep the screen on
          </ListItem>
          <ListItem
            trailing={
              <StatusBadge
                label={
                  !supported ? "Unsupported" : holding ? "Holding" : "Released"
                }
                type={!supported ? "warning" : holding ? "success" : "warning"}
              />
            }
          >
            Wake lock
          </ListItem>
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="In React, drive it with enabled. Outside React, call the platform's adapter (expoKeepAwakeAdapter / webKeepAwakeAdapter) with your own tag."
      >
        <CodeBlock
          code="npx expo install expo-keep-awake @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="ScannerScreen.tsx" />
      </Section>
    </Page>
  );
}
