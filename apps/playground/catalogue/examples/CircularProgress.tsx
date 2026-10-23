import {
  Button,
  Card,
  CircularProgress,
  HStack,
  Typography,
  VStack,
  type CircularProgressProps,
} from "@its/glowup-ui";

const props: Partial<CircularProgressProps> = {
  progress: 0.8,
  size: 96,
  strokeWidth: 8,
};

export default function CircularProgressExample() {
  // Without a `progress` the ring spins instead, and has nothing to count.
  const percent =
    props.progress === undefined ? "" : `${Math.round(props.progress * 100)}%`;

  return (
    <Card variant="outlined">
      <HStack spacing="m" align="center">
        <CircularProgress label={percent} {...props} />
        <VStack spacing="xs" style={{ flex: 1 }}>
          <Typography variant="titleMedium">Profile completeness</Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            Add a phone number so your team can reach you.
          </Typography>
          <Button variant="tonal" iconName="phone-plus-outline">
            Add phone
          </Button>
        </VStack>
      </HStack>
    </Card>
  );
}
