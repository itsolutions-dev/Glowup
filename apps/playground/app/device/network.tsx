import { useState } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  ListItem,
  ListSection,
  StatusBadge,
} from "@its/glowup-ui";
import { useIsOnline, useNetwork } from "@its/glowup-device/network";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const USAGE = `import { useIsOnline, useNetwork } from "@its/glowup-device/network";

function SyncBanner() {
  const online = useIsOnline(); // true / false, or null while unknown
  return online === false
    ? <Banner visible message="You are offline: changes sync later." />
    : null;
}

function UploadButton() {
  const { isExpensive } = useNetwork();
  // Hold back on a metered connection.
  return <Button disabled={isExpensive === true}>Upload</Button>;
}`;

/** `null` is "unknown", never "no". */
const yesNo = (value: boolean | null) =>
  value === null ? "Unknown" : value ? "Yes" : "No";

export default function NetworkPage() {
  const network = useNetwork();
  const online = useIsOnline();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await network.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Page
      eyebrow="@its/glowup-device/network"
      title="Network"
      description="The connection, kept live: one platform subscription shared by every component that asks. Every field the platform cannot tell is null — shown here as Unknown, never as No."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "A browser cannot know whether the internet answers without a request of its own, so “Internet reachable” stays Unknown while online. Type and metered come from the Network Information API (Chromium only)."
              : "Turn on airplane mode or switch Wi-Fi off: the page follows the change on its own."
          }
        />
      }
    >
      <Section title="This connection">
        <HStack spacing="m" align="center" wrap>
          <StatusBadge
            label={
              network.isLoading
                ? "Checking…"
                : online === null
                  ? "Unknown"
                  : online
                    ? "Online"
                    : "Offline"
            }
            type={online === false ? "error" : online ? "success" : "warning"}
          />
          <Button
            mode="outlined"
            iconName="refresh"
            loading={refreshing}
            onPress={refresh}
          >
            Check again
          </Button>
        </HStack>
        <ListSection>
          <ListItem secondary={yesNo(network.isConnected)}>
            Network interface up
          </ListItem>
          <ListItem secondary={yesNo(network.isInternetReachable)}>
            Internet reachable
          </ListItem>
          <ListItem secondary={network.type}>Type</ListItem>
          <ListItem secondary={yesNo(network.isExpensive)}>
            Metered (expensive)
          </ListItem>
          <ListItem secondary={network.cellularGeneration ?? "—"}>
            Cellular generation
          </ListItem>
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="useIsOnline() prefers “internet reachable” and falls back to “interface up”. On native, netinfo probes reachability itself."
      >
        <CodeBlock
          code="npx expo install @react-native-community/netinfo @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="SyncBanner.tsx" />
      </Section>
    </Page>
  );
}
