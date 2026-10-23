import {
  Avatar,
  Card,
  HStack,
  LinearProgress,
  Typography,
  VStack,
  type LinearProgressProps,
} from "@its/glowup-ui";

const props: Partial<LinearProgressProps> = {
  progress: 0.66,
  height: 8,
};

export default function LinearProgressExample() {
  const percent = `${Math.round((props.progress ?? 0) * 100)}%`;

  return (
    <Card variant="outlined">
      <VStack spacing="m">
        <HStack spacing="m" align="center">
          <Avatar icon="file-pdf-box" variant="rounded" />
          <VStack style={{ flex: 1 }}>
            <Typography variant="titleSmall">Invoice-2041.pdf</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              Uploading, 3.2 MB of 4.8 MB
            </Typography>
          </VStack>
        </HStack>
        <LinearProgress label={percent} {...props} />
      </VStack>
    </Card>
  );
}
