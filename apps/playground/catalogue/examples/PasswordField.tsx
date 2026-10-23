import { useState } from "react";
import {
  Button,
  PasswordField,
  Typography,
  VStack,
  passwordStrength,
  type PasswordFieldProps,
} from "@its/glowup-ui";

const props: Partial<PasswordFieldProps> = {
  autoComplete: "new-password",
  showStrength: true,
};

export default function PasswordFieldExample() {
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <VStack spacing="m" align="flex-start">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Choose a new password</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          You will be signed out of your other devices.
        </Typography>
      </VStack>
      <PasswordField
        {...props}
        label="New password"
        placeholder="At least 12 characters"
        helperText="Mix letters, numbers and symbols."
        value={password}
        onChange={(text) => {
          setPassword(text);
          setSaved(false);
        }}
      />
      <Button
        disabled={passwordStrength(password) < 2}
        onClick={() => setSaved(true)}
      >
        Update password
      </Button>
      {saved && (
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Password updated.
        </Typography>
      )}
    </VStack>
  );
}
