import { useState } from "react";
import {
  Button,
  PinInput,
  StatusBadge,
  Typography,
  VStack,
  type PinInputProps,
} from "@its/glowup-ui";

const props: Partial<PinInputProps> = {
  label: "Verification code",
  cellSize: 44,
  helperText: "Try 123456. You can paste the whole code into any cell.",
};

const CODE = "123456";

export default function PinInputExample() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"idle" | "ok" | "wrong">("idle");
  const length = props.length ?? 6;

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Check your phone</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          We sent a code by SMS to the number ending in 4821.
        </Typography>
      </VStack>
      <PinInput
        {...props}
        value={code}
        onChange={(next) => {
          setCode(next);
          setResult("idle");
        }}
        onComplete={(full) =>
          setResult(full === CODE.slice(0, length) ? "ok" : "wrong")
        }
        error={result === "wrong" ? "That code is not right." : props.error}
      />
      {result === "ok" ? (
        <StatusBadge label="Phone verified" />
      ) : (
        <Button
          variant="text"
          iconName="message-text-outline"
          onClick={() => {
            setCode("");
            setResult("idle");
          }}
        >
          Send a new code
        </Button>
      )}
    </VStack>
  );
}
