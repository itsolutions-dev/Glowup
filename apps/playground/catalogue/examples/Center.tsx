import { useState } from "react";
import {
  Button,
  Center,
  CircularProgress,
  Icon,
  Typography,
  VStack,
  useTheme,
  type CenterProps,
} from "@its/glowup-ui";

const props: Partial<CenterProps> = {
  direction: "column",
};

export default function CenterExample() {
  const { theme } = useTheme();
  const [syncing, setSyncing] = useState(false);

  return (
    <VStack spacing="s">
      {/* Every child is centred on both axes; `direction` picks how they flow. */}
      <Center
        {...props}
        height={200}
        gap={theme.spacing.s}
        padding={theme.spacing.m}
        radius="large"
        background="surfaceContainerLow"
      >
        {syncing ? (
          <CircularProgress size={48} />
        ) : (
          <Icon
            source="cloud-off-outline"
            size={48}
            color={theme.colors.onSurfaceVariant}
          />
        )}
        <Typography variant="titleMedium">
          {syncing ? "Syncing notes" : "You're offline"}
        </Typography>
        <Button
          variant={syncing ? "outlined" : "filled"}
          iconName={syncing ? "close" : "refresh"}
          onClick={() => setSyncing(!syncing)}
        >
          {syncing ? "Cancel" : "Try again"}
        </Button>
      </Center>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        Changes are saved on this device and sync when you reconnect.
      </Typography>
    </VStack>
  );
}
