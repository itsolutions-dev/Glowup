import { useState } from "react";
import {
  Button,
  InputArea,
  Typography,
  VStack,
  type InputAreaProps,
} from "@its/glowup-ui";

const props: Partial<InputAreaProps> = {
  label: "What went wrong?",
  placeholder: "Describe the problem and what you expected to happen.",
  helperText: "The more detail, the faster we can help.",
  minRows: 3,
  maxRows: 8,
  maxLength: 500,
  required: true,
};

export default function InputAreaExample() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const tooShort = message.length > 0 && message.trim().length < 20;

  return (
    <VStack spacing="m" align="flex-start">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Contact support</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          We reply within one working day.
        </Typography>
      </VStack>
      <InputArea
        {...props}
        value={message}
        onChange={(text) => {
          setMessage(text);
          setSent(false);
        }}
        error={tooShort ? "Write at least 20 characters." : props.error}
      />
      <Button
        disabled={message.trim().length < 20 || sent}
        onClick={() => setSent(true)}
      >
        Send ticket
      </Button>
      {sent && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {`Ticket sent: ${message.trim().split("\n")[0].slice(0, 40)}`}
        </Typography>
      )}
    </VStack>
  );
}
