import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  ChipGroup,
  EmptyState,
  HStack,
  Input,
  LinearProgress,
  PinInput,
  Select,
  Stepper,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const STEPS = [
  { label: "Account", icon: "account-outline" },
  { label: "Verify", icon: "email-check-outline" },
  { label: "Profile", icon: "card-account-details-outline" },
];

const ROLES = [
  { id: "dev", label: "Developer", value: "dev" },
  { id: "design", label: "Designer", value: "design" },
  { id: "pm", label: "Product manager", value: "pm" },
];

const INTERESTS = [
  { value: "mobile", label: "Mobile", icon: "cellphone" },
  { value: "web", label: "Web", icon: "web" },
  { value: "design", label: "Design systems", icon: "palette-outline" },
  { value: "a11y", label: "Accessibility", icon: "human" },
] as const;

/** 0–1 score: length plus one point per character class. */
const strengthOf = (password: string) => {
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^\w]/].filter((re) =>
    re.test(password),
  ).length;
  return Math.min(1, (Math.min(password.length, 12) / 12 + classes / 4) / 2);
};

/**
 * A three-step registration: account details with a live password meter, a
 * one-time code, then a short profile. Back and Next keep every value, and the
 * Stepper lets the reader jump back to a step already done.
 */
export default function SignUp() {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("dev");
  const [interests, setInterests] = useState<string[]>(["web"]);
  const [terms, setTerms] = useState(false);

  const strength = strengthOf(password);
  const strengthLabel =
    strength > 0.75 ? "Strong" : strength > 0.45 ? "Good" : "Weak";
  const strengthColor =
    strength > 0.75
      ? theme.colors.primary
      : strength > 0.45
        ? theme.colors.tertiary
        : theme.colors.error;

  const canContinue = [
    /^\S+@\S+\.\S+$/.test(email) && password.length >= 8,
    code.length === 6,
    name.trim().length > 0 && terms,
  ][step];

  if (done) {
    return (
      <Box
        padding={32}
        radius="extraLarge"
        background="surface"
        borderWidth={1}
        borderColor="outlineVariant"
      >
        <EmptyState
          icon="party-popper"
          title={`Welcome aboard, ${name.split(" ")[0]}!`}
          description="Your workspace is ready. We sent a summary to your inbox."
          action={{
            label: "Start over",
            iconName: "restart",
            onPress: () => {
              setDone(false);
              setStep(0);
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      padding={24}
      gap={24}
      radius="extraLarge"
      background="surface"
      borderWidth={1}
      borderColor="outlineVariant"
    >
      <VStack spacing="xs">
        <Typography
          variant="headlineSmall"
          style={{ color: theme.colors.onSurface }}
        >
          Create your account
        </Typography>
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Step {step + 1} of {STEPS.length} · takes about a minute
        </Typography>
      </VStack>

      <Stepper
        steps={STEPS}
        activeStep={step}
        onClick={(index) => index < step && setStep(index)}
      />

      {step === 0 && (
        <VStack spacing="m">
          <Input
            label="Work email"
            value={email}
            onChange={setEmail}
            leadingIcon="email-outline"
            required
          />
          <Input
            label="Password"
            value={password}
            onChange={setPassword}
            leadingIcon="lock-outline"
            secureTextEntry
            required
          />
          <VStack spacing="xs">
            <LinearProgress
              progress={strength}
              color={strengthColor}
              height={6}
            />
            <Typography
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Password strength: {password ? strengthLabel : "—"}
            </Typography>
          </VStack>
        </VStack>
      )}

      {step === 1 && (
        <VStack spacing="m" align="center">
          <Typography
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            We sent a 6-digit code to {email}. Enter it below.
          </Typography>
          <PinInput
            value={code}
            onChange={setCode}
            length={6}
            helperText="Any six digits will do in this demo"
          />
          <Button variant="text" iconName="refresh" onClick={() => setCode("")}>
            Resend code
          </Button>
        </VStack>
      )}

      {step === 2 && (
        <VStack spacing="m">
          <Input
            label="Full name"
            value={name}
            onChange={setName}
            leadingIcon="account-outline"
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={setRole}
            options={ROLES}
          />
          <VStack spacing="s">
            <Typography
              variant="labelLarge"
              style={{ color: theme.colors.onSurface }}
            >
              What are you building?
            </Typography>
            <ChipGroup
              multiple
              wrap
              accessibilityLabel="Interests"
              options={[...INTERESTS]}
              value={interests}
              onChange={setInterests}
            />
          </VStack>
          <Checkbox
            checked={terms}
            onValueChange={setTerms}
            label="I agree to the Terms and the Privacy Policy"
          />
        </VStack>
      )}

      <HStack justify="space-between" align="center">
        <Button
          variant="text"
          iconName="arrow-left"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            iconName="arrow-right"
            iconPosition="end"
            disabled={!canContinue}
            onClick={() => setStep(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            iconName="check"
            disabled={!canContinue}
            onClick={() => setDone(true)}
          >
            Create account
          </Button>
        )}
      </HStack>
    </Box>
  );
}
