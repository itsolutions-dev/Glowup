import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  HStack,
  Spacer,
  Typography,
  VStack,
  type SpacerProps,
} from "@its/glowup-ui";

const props: SpacerProps = {
  axis: "horizontal",
};

export default function SpacerExample() {
  const [following, setFollowing] = useState(false);

  return (
    <Card variant="outlined">
      <Box variant="flex" align="center">
        <HStack spacing="s" align="center">
          <Avatar name="Mara Quinn" status="online" />
          <VStack spacing="xs">
            <Typography variant="titleSmall">Mara Quinn</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              Product designer
            </Typography>
          </VStack>
        </HStack>
        {/* No size: it takes what the row has left and pushes the button over. */}
        <Spacer {...props} />
        <Button
          variant={following ? "tonal" : "filled"}
          onClick={() => setFollowing(!following)}
        >
          {following ? "Following" : "Follow"}
        </Button>
      </Box>
    </Card>
  );
}
