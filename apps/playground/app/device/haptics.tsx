import { useState } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  ListItem,
  ListSection,
  Slider,
  StatusBadge,
  Switch,
} from "@its/glowup-ui";
import { useHaptics } from "@its/glowup-device/haptics";

import { CodeBlock } from "../../site/CodeBlock";
import { useHapticsPreference } from "../../site/HapticsPreference";
import { Page, Section } from "../../site/Page";

const WIRING = `import { ThemeProvider } from "@its/glowup-ui";
import { hapticFeedback } from "@its/glowup-device/haptics";

// Every Glowup button, switch, radio, chip and stepped slider answers
// with the platform's own feedback.
<ThemeProvider onInteractionFeedback={hapticFeedback}>
  <App />
</ThemeProvider>;

// One control opts out:
<Button feedback={false} onClick={save}>Save</Button>;`;

const USAGE = `import { useHaptics } from "@its/glowup-device/haptics";

function SaveButton() {
  const haptics = useHaptics();
  const save = async () => {
    const ok = await submit();
    haptics.notification(ok ? "success" : "error");
  };
  return <Button onClick={save}>Save</Button>;
}`;

export default function HapticsPage() {
  const haptics = useHaptics();
  const preference = useHapticsPreference();
  const [volume, setVolume] = useState(40);

  return (
    <Page
      eyebrow="@its/glowup-device/haptics"
      title="Haptics"
      description="Haptic feedback, and the bridge that makes every @its/glowup-ui control answer with the platform's own: this whole site is wired that way."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "Browsers have no haptics API, so nothing plays here: open the playground on a phone. The buttons still run, through a no-op adapter."
              : Platform.OS === "android"
                ? "Interactions honour the system's “touch feedback” setting; the explicit impacts and notifications below use the vibrator, which does not."
                : "Haptics do not play in the iOS Simulator; use a device."
          }
        />
      }
    >
      <Section
        title="Every control on this site"
        description="The playground's root ThemeProvider passes hapticFeedback to onInteractionFeedback while this switch is on (remembered on this device)."
      >
        <ListSection>
          <ListItem
            secondary="press · toggle · selection, from Button, Switch, Checkbox, Radio, Chip, segmented buttons and stepped sliders."
            trailing={
              <Switch
                value={preference.enabled}
                onChange={preference.setEnabled}
              />
            }
          >
            Interaction feedback
          </ListItem>
          <ListItem
            trailing={
              <StatusBadge
                label={haptics.isSupported ? "Supported" : "Unsupported"}
                type={haptics.isSupported ? "success" : "warning"}
              />
            }
          >
            Haptics on this platform
          </ListItem>
        </ListSection>
        <Slider
          label="A stepped slider: one tick per step"
          value={volume}
          step={10}
          marks
          showValueLabel
          onValueChange={setVolume}
        />
      </Section>

      <Section
        title="Play one"
        description="useHaptics() calls never reject and do nothing where unsupported."
      >
        <HStack spacing="s" wrap>
          {(["light", "medium", "heavy"] as const).map((style) => (
            <Button
              key={style}
              variant="tonal"
              feedback={false}
              onClick={() => void haptics.impact(style)}
            >
              {`Impact ${style}`}
            </Button>
          ))}
        </HStack>
        <HStack spacing="s" wrap>
          {(["success", "warning", "error"] as const).map((type) => (
            <Button
              key={type}
              variant="outlined"
              feedback={false}
              onClick={() => void haptics.notification(type)}
            >
              {`Notify ${type}`}
            </Button>
          ))}
          <Button
            variant="outlined"
            feedback={false}
            onClick={() => void haptics.selection()}
          >
            Selection
          </Button>
        </HStack>
      </Section>

      <Section
        title="Wire it up"
        description="The two packages never import each other: the kinds are the same strings, and the app connects them."
      >
        <CodeBlock
          code="npx expo install expo-haptics @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={WIRING} title="App.tsx" />
        <CodeBlock code={USAGE} title="SaveButton.tsx" />
      </Section>
    </Page>
  );
}
