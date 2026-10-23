import { useState } from "react";
import { View } from "react-native";
import {
  Badge,
  Button,
  HStack,
  IconButton,
  Typography,
  VStack,
  type BadgeProps,
} from "@its/glowup-ui";

const props: Partial<BadgeProps> = {
  count: 5,
  position: "top-right",
};

export default function BadgeExample() {
  const [seen, setSeen] = useState(false);

  return (
    <VStack spacing="s" align="flex-start">
      <HStack spacing="m" align="center">
        <Typography variant="titleMedium">Notifications</Typography>
        {/* The badge pins itself to the corner of this box. */}
        <View>
          <IconButton
            icon="bell-outline"
            accessibilityLabel="Mark notifications as read"
            onClick={() => setSeen(true)}
          />
          <Badge {...props} visible={!seen} />
        </View>
      </HStack>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {seen
          ? "You are all caught up."
          : "Press the bell to mark them as read."}
      </Typography>
      <Button variant="text" disabled={!seen} onClick={() => setSeen(false)}>
        Mark as unread
      </Button>
    </VStack>
  );
}
