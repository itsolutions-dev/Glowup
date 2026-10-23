import { useState } from "react";
import {
  Box,
  Button,
  HStack,
  Stepper,
  Typography,
  useTheme,
  type StepperProps,
} from "@its/glowup-ui";

const props: Partial<StepperProps> = {
  direction: "row",
};

const STEPS = ["Cart", "Shipping", "Payment", "Review"];
const DETAILS = [
  "2 items, EUR 86.00.",
  "Deliver to Via Roma 12, Turin.",
  "Card ending in 4242.",
  "Check everything, then place your order.",
];

export default function StepperExample() {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const done = step === STEPS.length;

  return (
    <Box
      background="surface"
      radius="large"
      borderWidth={1}
      borderColor="outlineVariant"
      padding={theme.spacing.m}
      gap={theme.spacing.m}
      width="100%"
      style={{ maxWidth: 480, alignSelf: "center" }}
    >
      <Stepper
        {...props}
        steps={STEPS}
        activeStep={step}
        onClick={(index) => index < step && setStep(index)}
      />
      {done ? (
        <>
          <Typography variant="titleMedium">Order placed</Typography>
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            We sent the receipt to your email.
          </Typography>
          <Button variant="tonal" onClick={() => setStep(0)}>
            Start over
          </Button>
        </>
      ) : (
        <>
          <Typography variant="titleMedium">{STEPS[step]}</Typography>
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            {DETAILS[step]}
          </Typography>
          <HStack spacing="s">
            <Button
              variant="outlined"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
            <Button onClick={() => setStep(step + 1)}>
              {step === STEPS.length - 1 ? "Place order" : "Continue"}
            </Button>
          </HStack>
        </>
      )}
    </Box>
  );
}
