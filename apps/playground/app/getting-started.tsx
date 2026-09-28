import { Banner } from "@its/glowup-ui";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";

const INSTALL = `npm install @its/glowup-ui`;

const PEERS = `npx expo install \\
  react-native-safe-area-context \\
  react-native-svg \\
  @expo/vector-icons`;

const PROVIDERS = `import {
  ThemeProvider,
  AlertProvider,
  AlertProviderWrapper,
  ToastProvider,
} from "@its/glowup-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <Screens />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}`;

const FIRST_SCREEN = `import { Button, Typography, VStack } from "@its/glowup-ui";

export const Screens = () => (
  <VStack p="m" spacing="s">
    <Typography variant="headlineMedium">Hello</Typography>
    <Button iconName="check" onPress={() => {}}>
      Tap me
    </Button>
  </VStack>
);`;

const THEME_HOOK = `import { useTheme } from "@its/glowup-ui";

const { theme, toggleTheme } = useTheme();
// theme.colors.primary, theme.spacing.m, theme.shape.large, theme.isDark`;

export default function GettingStarted() {
  return (
    <Page
      eyebrow="Setup"
      title="Getting started"
      description="Install the package, mount the providers, and everything in the reference works as documented."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message="Glowup is pre-1.0. The API can still change between minor versions — pin the version you build against."
        />
      }
    >
      <Section title="1. Install" description="The package itself.">
        <CodeBlock code={INSTALL} language="bash" title="Terminal" />
      </Section>

      <Section
        title="2. Install the peer dependencies"
        description="Native modules are peers so your app owns their versions. These three are all the library needs; on web, react-native-web brings react-dom."
      >
        <CodeBlock code={PEERS} language="bash" title="Terminal" />
      </Section>

      <Section
        title="3. Mount the providers"
        description="ThemeProvider is required; AlertProvider and ToastProvider only if you call Alert() or useToast(). AlertProviderWrapper is what binds the Alert singleton to the web dialog — mount it inside AlertProvider."
      >
        <CodeBlock code={PROVIDERS} title="App.tsx" />
      </Section>

      <Section
        title="4. Build a screen"
        description="Layout primitives take token names, not numbers, so a screen never hardcodes a spacing value."
      >
        <CodeBlock code={FIRST_SCREEN} title="Screens.tsx" />
      </Section>

      <Section
        title="5. Read the theme"
        description="Everything the library paints comes from here, and so should everything you build beside it."
      >
        <CodeBlock code={THEME_HOOK} title="anywhere.tsx" />
      </Section>
    </Page>
  );
}
