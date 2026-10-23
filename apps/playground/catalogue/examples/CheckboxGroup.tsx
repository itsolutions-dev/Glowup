import { useState } from "react";
import {
  CheckboxGroup,
  Typography,
  VStack,
  type CheckboxGroupProps,
} from "@its/glowup-ui";

const props: Partial<CheckboxGroupProps> = {
  label: "Remind me by",
  required: true,
  helperText: "You can change this later in Settings.",
};

const CHANNELS = [
  { label: "Email", value: "email" },
  { label: "SMS", value: "sms" },
  { label: "Push (not available here)", value: "push", disabled: true },
  { label: "Phone call", value: "call" },
];

export default function CheckboxGroupExample() {
  const [channels, setChannels] = useState<string[]>(["email"]);

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Appointment reminders</Typography>
      <CheckboxGroup
        {...props}
        options={CHANNELS}
        value={channels}
        onChange={setChannels}
        error={
          channels.length === 0 ? "Pick at least one channel." : props.error
        }
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {channels.length === 0
          ? "No reminders will be sent."
          : `We'll remind you by ${channels.join(", ")}.`}
      </Typography>
    </VStack>
  );
}
