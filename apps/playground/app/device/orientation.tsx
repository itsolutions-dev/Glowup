import { useState } from "react";
import { Platform } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Banner,
  ListItem,
  ListSection,
  StatusBadge,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@its/glowup-ui";
import {
  useOrientation,
  useOrientationLock,
  useOrientationLockSupport,
  type OrientationErrorCode,
  type OrientationLock,
} from "@its/glowup-device/orientation";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

type Choice = "none" | OrientationLock;

const CHOICES: { value: Choice; label: string }[] = [
  { value: "none", label: "App's own" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
  { value: "any", label: "Any" },
];

const ERROR_COPY: Record<OrientationErrorCode, string> = {
  unsupported:
    "This platform refused the lock. Browsers lock only on mobile Chromium in fullscreen.",
  failed: "The platform refused this orientation.",
};

const USAGE = `import {
  useOrientation,
  useOrientationLock,
} from "@its/glowup-device/orientation";

function Gallery() {
  const { isLandscape } = useOrientation();
  return <Grid container autoSize={1} columns={isLandscape ? 4 : 2} />;
}

function VideoPlayer() {
  // Until unmount; then the previous lock, or the app's own orientation.
  const { error } = useOrientationLock("landscape");
  return <Video hint={error ? "Rotate your phone" : undefined} />;
}`;

export default function OrientationPage() {
  const { theme } = useTheme();
  const { orientation, isLandscape, isLoading } = useOrientation();
  const supportsLock = useOrientationLockSupport();
  const [choice, setChoice] = useState<Choice>("none");
  // A page left in the stack stays mounted: release the lock when another
  // page is on screen, take it again on return.
  const focused = useIsFocused();
  const lock = useOrientationLock(choice === "none" ? "any" : choice, {
    enabled: choice !== "none" && focused,
  });

  return (
    <Page
      eyebrow="@its/glowup-device/orientation"
      title="Orientation"
      description="The interface orientation, kept live, and locks that last as long as the component that asks. Releasing the last lock gives the orientation back to the app's own configuration, not to “anything goes”."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "Reading works in every browser; locking almost never does (only mobile Chromium in fullscreen). Desktop Chromium has the API and refuses every lock."
              : "On iPad, iOS ignores locks while the app supports multitasking: set ios.requireFullScreen in app.json for them to apply."
          }
        />
      }
    >
      <Section title="Right now">
        <ListSection>
          <ListItem
            secondaryText={isLoading ? "Checking…" : orientation}
            action={
              isLandscape === null ? null : (
                <StatusBadge
                  label={isLandscape ? "Landscape" : "Portrait"}
                  type="success"
                />
              )
            }
            primaryText="Interface orientation"
          />
        </ListSection>
      </Section>

      <Section
        title="Lock it"
        description="useOrientationLock(lock, { enabled }) while this page is focused. A refused lock is reported in error, never thrown."
      >
        <ToggleButtonGroup
          options={CHOICES}
          value={choice}
          onValueChange={(next: Choice) => setChoice(next)}
        />
        <ListSection>
          <ListItem
            action={
              <StatusBadge
                label={
                  choice === "none"
                    ? "Not locked"
                    : lock.isActive
                      ? "Locked"
                      : lock.error
                        ? "Refused"
                        : "Locking…"
                }
                type={
                  lock.error ? "error" : lock.isActive ? "success" : "warning"
                }
              />
            }
            secondaryText={
              supportsLock
                ? undefined
                : "No lock API on this platform: every lock is refused."
            }
            primaryText="Lock"
          />
        </ListSection>
        {lock.error ? (
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.error }}
          >
            {ERROR_COPY[lock.error.code]}
          </Typography>
        ) : null}
      </Section>

      <Section
        title="Wire it up"
        description="Locks stack: the most recent wins and, when it lets go, the one before applies again."
      >
        <CodeBlock
          code="npx expo install expo-screen-orientation @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="VideoPlayer.tsx" />
      </Section>
    </Page>
  );
}
