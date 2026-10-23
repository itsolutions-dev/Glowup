import {
  Button,
  Card,
  Chip,
  Grid,
  HStack,
  Stat,
  Typography,
  VStack,
  Visible,
  useBreakpoint,
  useBreakpointValue,
  type VisibleProps,
} from "@its/glowup-ui";

const props: Partial<VisibleProps> = {
  above: "medium",
};

export default function VisibleExample() {
  const { sizeClass } = useBreakpoint();
  // The value of the largest size class at or below the window's.
  const span = useBreakpointValue({ compact: 12, medium: 6 }, 12);

  return (
    <VStack spacing="m">
      <HStack spacing="s" align="center">
        <Typography variant="titleLarge" style={{ flex: 1 }}>
          Storage
        </Typography>
        <Chip label={sizeClass} icon="monitor" variant="outlined" />
      </HStack>

      <Grid container spacing="m">
        <Grid size={span}>
          <Stat label="Used" value="38.2 GB" />
        </Grid>
        <Grid size={span}>
          <Stat label="Free" value="61.8 GB" />
        </Grid>
      </Grid>

      {/* A wide window gets the whole card, a narrow one a single button. */}
      <Visible
        {...props}
        fallback={
          <Button variant="text" iconName="arrow-up-circle-outline">
            Upgrade to 1 TB
          </Button>
        }
      >
        <Card variant="outlined">
          <VStack spacing="s">
            <Typography variant="titleMedium">Need more room?</Typography>
            <Typography variant="bodyMedium" color="onSurfaceVariant">
              Upgrade to 1 TB and keep every project, photo and backup in one
              place.
            </Typography>
            <HStack>
              <Button iconName="arrow-up-circle-outline">
                Upgrade to 1 TB
              </Button>
            </HStack>
          </VStack>
        </Card>
      </Visible>
    </VStack>
  );
}
