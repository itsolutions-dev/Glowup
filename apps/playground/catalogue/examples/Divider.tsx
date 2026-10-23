import { useState } from "react";
import {
  Button,
  Card,
  Divider,
  Input,
  Stack,
  Typography,
  VStack,
  type DividerProps,
} from "@its/glowup-ui";

const props: Partial<DividerProps> = {
  children: "or",
};

export default function DividerExample() {
  const [email, setEmail] = useState("");
  // A vertical rule needs a row to stand in, so the stack turns with it.
  const vertical = props.orientation === "vertical";
  const side = vertical ? { flex: 1 } : undefined;

  return (
    <Card variant="outlined">
      <Stack direction={vertical ? "horizontal" : "vertical"} spacing="m">
        <VStack spacing="s" style={side}>
          <Typography variant="titleMedium">Sign in</Typography>
          <Input label="Email" value={email} onChange={setEmail} />
          <Button disabled={!email.includes("@")}>Continue with email</Button>
        </VStack>
        <Divider {...props} />
        <VStack spacing="s" justify="center" style={side}>
          <Button variant="outlined" iconName="key-outline">
            Use a passkey
          </Button>
        </VStack>
      </Stack>
    </Card>
  );
}
