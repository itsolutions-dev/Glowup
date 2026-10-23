import { useState } from "react";
import {
  Avatar,
  Button,
  HStack,
  Stack,
  Stat,
  Typography,
  VStack,
  type StackProps,
} from "@its/glowup-ui";

const props: Partial<StackProps> = {
  spacing: "m",
  dividers: true,
};

export default function StackExample() {
  const [following, setFollowing] = useState(false);

  return (
    // A hairline between the sections, and the spacing around each one.
    <Stack {...props}>
      <HStack spacing="m" align="center">
        <Avatar name="Mara Quinn" size="large" status="online" />
        <VStack spacing="xs">
          <Typography variant="titleLarge">Mara Quinn</Typography>
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            Product designer · Lisbon
          </Typography>
        </VStack>
      </HStack>

      {/* Horizontal stack: the dividers turn vertical. */}
      <HStack spacing="m" dividers>
        <Stat style={{ flex: 1 }} label="Projects" value="24" />
        <Stat
          style={{ flex: 1 }}
          label="Followers"
          value={following ? "1,285" : "1,284"}
        />
        <Stat style={{ flex: 1 }} label="Rating" value="4.9" />
      </HStack>

      {/* Conditional children leave no divider behind. */}
      {following && (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          New projects from Mara will show up in your feed.
        </Typography>
      )}

      <HStack spacing="s">
        <Button
          variant={following ? "tonal" : "filled"}
          iconName={following ? "check" : "plus"}
          onClick={() => setFollowing(!following)}
        >
          {following ? "Following" : "Follow"}
        </Button>
        <Button variant="outlined" iconName="email-outline">
          Message
        </Button>
      </HStack>
    </Stack>
  );
}
