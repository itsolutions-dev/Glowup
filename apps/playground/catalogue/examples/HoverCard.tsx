import { useState } from "react";
import {
  Avatar,
  Button,
  HStack,
  HoverCard,
  Typography,
  VStack,
  type HoverCardProps,
} from "@its/glowup-ui";

const props: Partial<HoverCardProps> = {
  placement: "bottom",
  openDelay: 200,
};

export default function HoverCardExample() {
  const [following, setFollowing] = useState(false);

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Design review</Typography>
      <HStack spacing="s" align="center">
        <HoverCard
          {...props}
          content={
            <VStack spacing="s">
              <HStack spacing="s" align="center">
                <Avatar name="Ada Lovelace" status="online" />
                <VStack spacing="xs">
                  <Typography variant="titleSmall">Ada Lovelace</Typography>
                  <Typography variant="bodySmall" color="onSurfaceVariant">
                    Staff engineer, design systems
                  </Typography>
                </VStack>
              </HStack>
              <Typography variant="bodySmall">
                Maintains the component library. 128 reviews this year.
              </Typography>
              <Button
                variant={following ? "outlined" : "filled"}
                onClick={() => setFollowing(!following)}
              >
                {following ? "Following" : "Follow"}
              </Button>
            </VStack>
          }
        >
          <Typography variant="titleSmall" color="primary">
            Ada Lovelace
          </Typography>
        </HoverCard>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          commented 2 hours ago
        </Typography>
      </HStack>
      <Typography variant="bodyMedium">
        The new spacing scale reads much better on small screens. Merging after
        lunch.
      </Typography>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        Hover the name, or long press it on a touch screen.
      </Typography>
    </VStack>
  );
}
