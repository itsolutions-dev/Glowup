import { useState } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  Card,
  CardContent,
  CardTitle,
  HStack,
  Input,
  ListItem,
  ListSection,
  StatusBadge,
  Typography,
} from "@its/glowup-ui";
import {
  useSecureStore,
  useSecureValue,
  type ProtectedReadResult,
  type ProtectedWriteResult,
} from "@its/glowup-device/secure-store";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

const NOTE = { key: "note", options: { service: "playground" } } as const;
const SECRET = {
  key: "secret",
  options: { prompt: "Open the playground's secret", service: "playground" },
} as const;

const USAGE = `import { useSecureValue } from "@its/glowup-device/secure-store";

function SessionGate() {
  const token = useSecureValue("token", { service: "auth" });
  if (token.isLoading) return <Spinner />;
  return token.value ? <Home /> : <SignIn onToken={token.set} />;
}`;

const PROTECTED = `const store = useSecureStore();

await store.setProtected("refreshToken", token, {
  prompt: "Remember sign-in with Face ID",
  service: "auth",
});

const read = await store.getProtected("refreshToken", {
  prompt: "Sign in with Face ID",
  service: "auth",
});
if (read.status === "ok") signInWith(read.value);
else if (read.status === "invalidated") askToSignInAgain();`;

/** One of the two cards reading the same item. */
function NoteReader({ title }: { title: string }) {
  const note = useSecureValue(NOTE.key, NOTE.options);
  return (
    <Card variant="outlined">
      <CardTitle title={title} subtitle="useSecureValue" />
      <CardContent>
        <Typography variant="bodyLarge">
          {note.isLoading
            ? "Loading…"
            : note.error
              ? note.error.code
              : (note.value ?? "Nothing stored")}
        </Typography>
      </CardContent>
    </Card>
  );
}

type Outcome = ProtectedReadResult | ProtectedWriteResult;

function describe(outcome: Outcome): string {
  return outcome.status === "ok" && "value" in outcome
    ? `ok: ${outcome.value}`
    : outcome.status;
}

export default function SecureStorePage() {
  const store = useSecureStore();
  const note = useSecureValue(NOTE.key, NOTE.options);
  const [draft, setDraft] = useState("");
  const [secretDraft, setSecretDraft] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const supported = store.isSupported;

  const save = async () => {
    await note.set(draft);
    setDraft("");
  };

  return (
    <Page
      eyebrow="@its/glowup-device/secure-store"
      title="Secure store"
      description="Small secrets in the Keychain on iOS and Keystore-encrypted storage on Android: tokens, keys, nothing large. Protected items open only with the enrolled biometrics."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "Browsers have no secure storage, and the package offers no localStorage stand-in: this page shows the unsupported state. Open the playground on a phone."
              : "Protected items need enrolled biometrics and a real device: simulators and emulators do not ask for them."
          }
        />
      }
    >
      <Section
        title="A plain item"
        description="useSecureValue reads it once and shares it: both cards below read the same item, and a write through the package reaches them at once."
      >
        <Input
          label="Note"
          value={draft}
          onChangeText={setDraft}
          disabled={!supported}
        />
        <HStack spacing="s" wrap>
          <Button
            iconName="content-save-outline"
            disabled={!supported || draft.length === 0}
            onPress={() => void save()}
          >
            Save
          </Button>
          <Button
            mode="outlined"
            disabled={!supported || note.value === null}
            onPress={() => void note.remove()}
          >
            Remove
          </Button>
        </HStack>
        <NoteReader title="First reader" />
        <NoteReader title="Second reader" />
      </Section>

      <Section
        title="A protected item"
        description="Bound to the enrolled biometrics, with no passcode fallback. iOS asks to read it; Android asks to read and to write. Every outcome resolves as a status."
      >
        <Input
          label="Secret"
          value={secretDraft}
          onChangeText={setSecretDraft}
          disabled={!supported}
        />
        <HStack spacing="s" wrap>
          <Button
            iconName="lock-outline"
            disabled={!supported || secretDraft.length === 0}
            onPress={async () => {
              setOutcome(
                await store.setProtected(
                  SECRET.key,
                  secretDraft,
                  SECRET.options,
                ),
              );
              setSecretDraft("");
            }}
          >
            Save protected
          </Button>
          <Button
            mode="tonal"
            iconName="fingerprint"
            disabled={!supported}
            onPress={async () =>
              setOutcome(await store.getProtected(SECRET.key, SECRET.options))
            }
          >
            Read
          </Button>
          <Button
            mode="outlined"
            disabled={!supported}
            onPress={async () => {
              await store.removeProtected(SECRET.key, {
                service: SECRET.options.service,
              });
              setOutcome(null);
            }}
          >
            Remove
          </Button>
        </HStack>
        <ListSection>
          <ListItem
            secondary={
              outcome && "detail" in outcome && outcome.detail
                ? outcome.detail
                : "Add or remove a finger or a face in the settings, then read again: the item reads invalidated, not missing."
            }
            trailing={
              outcome ? (
                <StatusBadge
                  label={describe(outcome)}
                  type={outcome.status === "ok" ? "success" : "warning"}
                />
              ) : null
            }
          >
            Last outcome
          </ListItem>
        </ListSection>
      </Section>

      <Section
        title="Wire it up"
        description="List secureStore in the config plugin: it keeps the store out of Android's backups (a restored item could not be decrypted) and sets Face ID's purpose string for protected items."
      >
        <CodeBlock
          code="npx expo install expo-secure-store @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="SessionGate.tsx" />
        <CodeBlock code={PROTECTED} title="signIn.ts" />
      </Section>
    </Page>
  );
}
