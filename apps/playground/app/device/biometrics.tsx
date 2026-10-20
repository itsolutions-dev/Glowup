import { useState } from "react";
import { Platform } from "react-native";
import { useIsFocused } from "expo-router";
import {
  Banner,
  Button,
  Card,
  CardActions,
  CardContent,
  CardTitle,
  ListItem,
  ListSection,
  StatusBadge,
  Switch,
  ToggleButtonGroup,
  Typography,
} from "@its/glowup-ui";
import {
  useAppLock,
  useBiometrics,
  type AuthenticateOptions,
  type BiometricResult,
} from "@its/glowup-device/biometrics";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

type Fallback = NonNullable<AuthenticateOptions["fallback"]>;
type Strength = NonNullable<AuthenticateOptions["strength"]>;

const FALLBACKS: { value: Fallback; label: string }[] = [
  { value: "passcode", label: "Passcode fallback" },
  { value: "none", label: "Biometrics only" },
];

const STRENGTHS: { value: Strength; label: string }[] = [
  { value: "weak", label: "Weak" },
  { value: "strong", label: "Strong" },
];

const LOCK_PROMPT: AuthenticateOptions = {
  promptMessage: "Unlock the protected card",
  cancelLabel: "Cancel",
};

const USAGE = `import { useBiometrics } from "@its/glowup-device/biometrics";

function RevealCard({ onReveal }: { onReveal(): void }) {
  const biometrics = useBiometrics();
  const reveal = async () => {
    const result = await biometrics.authenticate({
      promptMessage: "Show the card details",
      cancelLabel: "Cancel", // both required: the platform default is English
    });
    if (result.success) onReveal();
  };
  return <Button onClick={reveal}>Show</Button>;
}`;

const APP_LOCK = `import { useAppLock } from "@its/glowup-device/biometrics";

function Root() {
  const lock = useAppLock({
    enabled: settings.appLock,
    relockAfter: 0, // ms in the background; 0 = as soon as the app leaves
    prompt: { promptMessage: "Unlock the app", cancelLabel: "Cancel" },
  });
  if (lock.isLocked) {
    return <LockScreen onUnlock={lock.unlock} busy={lock.isAuthenticating} />;
  }
  return <App />;
}`;

function describeResult(result: BiometricResult): string {
  return result.success ? "Success" : result.error;
}

export default function BiometricsPage() {
  const biometrics = useBiometrics();
  const [fallback, setFallback] = useState<Fallback>("passcode");
  const [strength, setStrength] = useState<Strength>("weak");
  const [result, setResult] = useState<BiometricResult | null>(null);

  // The lock guards a card on this page, not the site, and only while the
  // page is on screen.
  const [lockWanted, setLockWanted] = useState(false);
  const focused = useIsFocused();
  const lock = useAppLock({
    enabled: lockWanted && focused,
    prompt: LOCK_PROMPT,
  });

  const authenticate = async () => {
    setResult(
      await biometrics.authenticate({
        promptMessage: "Authenticate on the playground",
        cancelLabel: "Cancel",
        fallback,
        strength,
      }),
    );
  };

  const supported = biometrics.isSupported;
  const types = biometrics.types.length ? biometrics.types.join(", ") : "None";

  return (
    <Page
      eyebrow="@its/glowup-device/biometrics"
      title="Biometrics"
      description="A local gate: the device owner proves they are holding the phone with a fingerprint, a face or the device passcode. It proves nothing to a server, so it never replaces your app's authentication."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "Browsers have no local authentication: this page shows the unsupported state. Open the playground on a phone."
              : Platform.OS === "ios"
                ? "Face ID needs a purpose string, which this build sets through the package's config plugin. In the Simulator, enrol a face from Features ▸ Face ID."
                : "With the passcode fallback, Android may pause the app behind the PIN screen; the app lock below does not count that trip."
          }
        />
      }
    >
      <Section
        title="This device"
        description="Read again whenever the app returns to the foreground: enrol a finger in the settings and come back."
      >
        <ListSection>
          <ListItem
            action={
              <StatusBadge
                label={supported ? "Supported" : "Unsupported"}
                type={supported ? "success" : "warning"}
              />
            }
            primaryText="Local authentication"
          />
          <ListItem
            secondaryText={biometrics.isLoading ? "Checking…" : types}
            primaryText="Sensors"
          />
          <ListItem
            secondaryText={
              biometrics.isLoading
                ? "Checking…"
                : biometrics.isEnrolled
                  ? "Enrolled"
                  : "Not enrolled"
            }
            primaryText="Biometrics"
          />
          <ListItem
            secondaryText={
              biometrics.isLoading ? "Checking…" : biometrics.level
            }
            primaryText="Strongest method"
          />
        </ListSection>
      </Section>

      <Section
        title="Prompt"
        description="authenticate() resolves with the outcome and never rejects for one: a cancel is a result, not an exception. Strength applies to Android only."
      >
        <ToggleButtonGroup
          options={FALLBACKS}
          value={fallback}
          onValueChange={(next: Fallback) => setFallback(next)}
        />
        <ToggleButtonGroup
          options={STRENGTHS}
          value={strength}
          onValueChange={(next: Strength) => setStrength(next)}
        />
        <Button
          iconName="fingerprint"
          disabled={!supported || biometrics.isAuthenticating}
          onClick={() => void authenticate()}
        >
          Authenticate
        </Button>
        <ListSection>
          <ListItem
            secondaryText={
              result && !result.success ? result.detail : "No prompt yet."
            }
            action={
              result ? (
                <StatusBadge
                  label={describeResult(result)}
                  type={result.success ? "success" : "error"}
                />
              ) : null
            }
            primaryText="Last result"
          />
        </ListSection>
      </Section>

      <Section
        title="App lock"
        description="useAppLock() decides when the app is locked: at a cold start and whenever it comes back from the background. Here it guards one card while this page is on screen; your app would guard its root."
      >
        <ListSection>
          <ListItem
            secondaryText={
              !supported
                ? "Nothing to unlock with on this platform."
                : lock.isLockable
                  ? "Locks as soon as the app leaves (relockAfter: 0)."
                  : 'No lock screen on this device: the lock stays open (whenUnavailable: "unlock").'
            }
            action={
              <Switch
                value={lockWanted && supported}
                disabled={!supported}
                onChange={setLockWanted}
              />
            }
            primaryText="Lock the card"
          />
        </ListSection>
        <Card variant="outlined">
          <CardTitle
            title="Protected card"
            subtitle={lock.isLocked ? "Locked" : "Visible"}
          />
          <CardContent>
            <Typography variant="bodyLarge">
              {lock.isLocked ? "•••• •••• •••• ••••" : "4242 4242 4242 4242"}
            </Typography>
          </CardContent>
          <CardActions align="end">
            {lock.isLocked ? (
              <Button
                variant="filled"
                iconName="lock-open-outline"
                disabled={lock.isAuthenticating}
                onClick={() => void lock.unlock()}
              >
                Unlock
              </Button>
            ) : (
              <Button
                variant="text"
                iconName="lock-outline"
                disabled={!lockWanted || !supported}
                onClick={lock.lock}
              >
                Lock now
              </Button>
            )}
          </CardActions>
        </Card>
      </Section>

      <Section
        title="Wire it up"
        description="On iOS, set the Face ID purpose string with the config plugin: without it Face ID quietly falls back to the passcode."
      >
        <CodeBlock
          code="npx expo install expo-local-authentication @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="RevealCard.tsx" />
        <CodeBlock code={APP_LOCK} title="Root.tsx" />
      </Section>
    </Page>
  );
}
