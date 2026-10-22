import { useState } from "react";
import {
  Button,
  Divider,
  Typography,
  VStack,
  type ButtonProps,
} from "@its/glowup-ui";

const props: Partial<ButtonProps> = {
  children: "Save changes",
  iconName: "content-save-outline",
};

export default function ButtonExample() {
  const [saves, setSaves] = useState(0);

  return (
    <VStack spacing="m" align="center">
      <VStack spacing="xs" align="center">
        <Typography variant="titleMedium">Profile</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {saves === 0
            ? "You have unsaved changes."
            : `Saved ${saves} ${saves === 1 ? "time" : "times"}.`}
        </Typography>
      </VStack>
      <Divider />
      <Button {...props} onClick={() => setSaves((n) => n + 1)} />
    </VStack>
  );
}
