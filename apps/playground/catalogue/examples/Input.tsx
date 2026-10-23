import { useState } from "react";
import {
  Button,
  Input,
  Typography,
  VStack,
  type InputProps,
} from "@its/glowup-ui";

const props: Partial<InputProps> = {
  label: "Work email",
  placeholder: "you@company.com",
  helperText: "We'll send a confirmation link.",
  leadingIcon: "email-outline",
  required: true,
};

export default function InputExample() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const invalid = email.length > 0 && !email.includes("@");

  return (
    <VStack spacing="m" align="flex-start">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Create your account</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Start with your work email.
        </Typography>
      </VStack>
      <Input
        {...props}
        value={email}
        onChange={(text) => {
          setEmail(text);
          setSent(false);
        }}
        error={invalid ? "Enter a valid email address." : props.error}
      />
      <Button disabled={!email || invalid} onClick={() => setSent(true)}>
        Send link
      </Button>
      {sent && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {`Link sent to ${email}.`}
        </Typography>
      )}
    </VStack>
  );
}
