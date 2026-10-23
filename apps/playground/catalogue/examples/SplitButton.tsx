import { useState } from "react";
import {
  Divider,
  SplitButton,
  Typography,
  VStack,
  type MenuItem,
  type SplitButtonProps,
} from "@its/glowup-ui";

const props: Partial<SplitButtonProps> = {
  children: "Send",
  iconName: "send-outline",
};

export default function SplitButtonExample() {
  const [status, setStatus] = useState("Not sent yet.");

  const items: MenuItem[] = [
    {
      id: "schedule",
      label: "Schedule for Monday",
      icon: "clock-outline",
      onClick: () => setStatus("Scheduled for Monday, 9:00."),
    },
    {
      id: "draft",
      label: "Save as draft",
      icon: "file-outline",
      onClick: () => setStatus("Saved to drafts."),
    },
    {
      id: "discard",
      label: "Discard",
      icon: "delete-outline",
      destructive: true,
      dividerAbove: true,
      onClick: () => setStatus("Discarded."),
    },
  ];

  return (
    <VStack spacing="m" align="center">
      <VStack spacing="xs" align="center">
        <Typography variant="titleMedium">Quarterly update</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          To the whole team · 3 attachments
        </Typography>
      </VStack>
      <Divider />
      <SplitButton
        {...props}
        items={items}
        onPress={() => setStatus("Sent just now.")}
      >
        {props.children ?? ""}
      </SplitButton>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {status}
      </Typography>
    </VStack>
  );
}
