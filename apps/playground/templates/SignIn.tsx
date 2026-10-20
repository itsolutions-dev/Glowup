import { useState } from "react";
import { View } from "react-native";
import {
  Banner,
  Box,
  Button,
  Checkbox,
  Divider,
  HStack,
  Icon,
  Input,
  Link,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const HIGHLIGHTS = [
  { icon: "shield-check-outline", text: "Single sign-on and 2FA built in" },
  { icon: "sync", text: "Your workspace, synced on every device" },
  { icon: "account-group-outline", text: "Invite your team in seconds" },
] as const;

/**
 * A split sign-in screen: a brand panel that wraps above the form on a phone,
 * social providers first, then email and password with inline validation.
 */
export default function SignIn() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const emailError =
    submitted && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email" : "";
  const passwordError =
    submitted && password.length < 8 ? "At least 8 characters" : "";

  const signIn = () => {
    setSubmitted(true);
    setSignedIn(/^\S+@\S+\.\S+$/.test(email) && password.length >= 8);
  };

  return (
    <Box
      row
      wrap
      radius="extraLarge"
      bg="surface"
      borderWidth={1}
      borderColor="outlineVariant"
      style={{ overflow: "hidden" }}
    >
      {/* Brand panel: grows beside the form, wraps above it when narrow. */}
      <Box
        bg="primaryContainer"
        p="xl"
        gap="l"
        justify="space-between"
        style={{ flexGrow: 1, flexBasis: 280 }}
      >
        <HStack spacing="s" align="center">
          <Icon source="lightning-bolt" color={theme.colors.primary} />
          <Typography
            variant="titleMedium"
            style={{ color: theme.colors.onPrimaryContainer }}
          >
            Acme Cloud
          </Typography>
        </HStack>

        <VStack spacing="m">
          <Typography
            variant="headlineMedium"
            style={{ color: theme.colors.onPrimaryContainer }}
          >
            Everything your team ships, in one place.
          </Typography>
          {HIGHLIGHTS.map((item) => (
            <HStack key={item.text} spacing="s" align="center">
              <Icon
                source={item.icon}
                size={20}
                color={theme.colors.onPrimaryContainer}
              />
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {item.text}
              </Typography>
            </HStack>
          ))}
        </VStack>

        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onPrimaryContainer }}
        >
          Trusted by 4,000+ teams worldwide
        </Typography>
      </Box>

      {/* Form panel */}
      <Box p="xl" gap="l" style={{ flexGrow: 1, flexBasis: 320 }}>
        <VStack spacing="xs">
          <Typography
            variant="headlineSmall"
            style={{ color: theme.colors.onSurface }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Sign in to continue to your workspace.
          </Typography>
        </VStack>

        <Banner
          visible={signedIn}
          type="info"
          icon="check-circle-outline"
          message={`Signed in as ${email}`}
          dismissable
          onDismiss={() => setSignedIn(false)}
        />

        <HStack spacing="s" wrap>
          <View style={{ flexGrow: 1 }}>
            <Button variant="outlined" iconName="google" fullWidth>
              Google
            </Button>
          </View>
          <View style={{ flexGrow: 1 }}>
            <Button variant="outlined" iconName="microsoft" fullWidth>
              Microsoft
            </Button>
          </View>
        </HStack>

        <Divider>or</Divider>

        <VStack spacing="m">
          <Input
            label="Email"
            value={email}
            onChange={setEmail}
            leadingIcon="email-outline"
            placeholder="you@company.com"
            error={emailError}
            required
          />
          <Input
            label="Password"
            value={password}
            onChange={setPassword}
            secureTextEntry={!showPassword}
            leadingIcon="lock-outline"
            trailingIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onTrailingIconPress={() => setShowPassword((shown) => !shown)}
            error={passwordError}
            helperText="At least 8 characters"
            required
          />
          <HStack justify="space-between" align="center" wrap>
            <Checkbox
              checked={remember}
              onValueChange={setRemember}
              label="Keep me signed in"
            />
            <Link onPress={() => {}}>Forgot password?</Link>
          </HStack>
        </VStack>

        <Button variant="filled" iconName="login" fullWidth onClick={signIn}>
          Sign in
        </Button>

        <HStack spacing="xs" justify="center" align="center">
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            New to Acme?
          </Typography>
          <Link onPress={() => {}}>Create an account</Link>
        </HStack>
      </Box>
    </Box>
  );
}
