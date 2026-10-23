import { useState } from "react";
import {
  HStack,
  Icon,
  TouchableRipple,
  Typography,
  VStack,
  useTheme,
  type TouchableRippleProps,
} from "@its/glowup-ui";

const props: Partial<TouchableRippleProps> = {
  borderRadius: 12,
};

export default function TouchableRippleExample() {
  const { theme } = useTheme();
  const [on, setOn] = useState(true);

  return (
    <VStack spacing="s">
      <TouchableRipple
        underlayColor={theme.colors.surfaceContainerHigh}
        accessibilityRole="switch"
        accessibilityLabel="Wi-Fi"
        accessibilityState={{ checked: on }}
        {...props}
        onPress={() => setOn(!on)}
      >
        <HStack spacing="m" align="center" padding={theme.spacing.m}>
          <Icon
            source={on ? "wifi" : "wifi-off"}
            color={on ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <VStack spacing="xs" style={{ flex: 1 }}>
            <Typography variant="titleSmall">Wi-Fi</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              {on ? "Connected to Home network" : "Off"}
            </Typography>
          </VStack>
        </HStack>
      </TouchableRipple>
      <Typography variant="caption" color="onSurfaceVariant">
        Hover, focus or press the tile to see the state layer.
      </Typography>
    </VStack>
  );
}
