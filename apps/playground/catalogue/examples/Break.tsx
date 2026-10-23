import {
  Box,
  Break,
  Button,
  HStack,
  Icon,
  Typography,
  useTheme,
  type BreakProps,
} from "@its/glowup-ui";

const props: Partial<BreakProps> = {
  inline: "m",
  blockStart: "m",
};

export default function BreakExample() {
  const { theme } = useTheme();

  return (
    // The card pads every edge by `m`; Break takes that back where it is told to.
    <Box
      padding={theme.spacing.m}
      gap={theme.spacing.s}
      radius="large"
      background="surfaceContainerLow"
      style={{ overflow: "hidden" }}
    >
      <Break {...props}>
        <HStack
          spacing="s"
          align="center"
          padding={theme.spacing.m}
          background="primaryContainer"
        >
          <Icon
            source="party-popper"
            size={24}
            color={theme.colors.onPrimaryContainer}
          />
          <Typography variant="labelLarge" color="onPrimaryContainer">
            New in version 2.4
          </Typography>
        </HStack>
      </Break>

      <Typography variant="titleMedium">Offline mode is here</Typography>
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        Keep working on a train or a plane: your changes are stored on the
        device and sync as soon as you are back online.
      </Typography>
      <Box variant="flex">
        <Button variant="tonal" iconName="open-in-new">
          Read the release notes
        </Button>
      </Box>
    </Box>
  );
}
