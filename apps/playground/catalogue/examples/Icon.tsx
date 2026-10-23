import { useState } from "react";
import {
  Box,
  Button,
  Card,
  HStack,
  Icon,
  Typography,
  VStack,
  useTheme,
  type IconProps,
} from "@its/glowup-ui";

const props: IconProps = {
  source: "cloud-upload-outline",
  size: 32,
};

export default function IconExample() {
  const { theme } = useTheme();
  const [done, setDone] = useState(false);

  return (
    <Card variant="outlined">
      <VStack spacing="m">
        <HStack spacing="m" align="center">
          <Box
            variant="centered-flex"
            padding={theme.spacing.s}
            radius="extraLarge"
            background="secondaryContainer"
          >
            <Icon color={theme.colors.onSecondaryContainer} {...props} />
          </Box>
          <VStack spacing="xs" style={{ flex: 1 }}>
            <Typography variant="titleSmall">Photo backup</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              {done ? "Backed up just now" : "Last backup yesterday, 21:40"}
            </Typography>
          </VStack>
        </HStack>
        <Button variant="tonal" disabled={done} onClick={() => setDone(true)}>
          Back up now
        </Button>
      </VStack>
    </Card>
  );
}
