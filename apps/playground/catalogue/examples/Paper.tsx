import { useState } from "react";
import {
  Button,
  LinearProgress,
  Paper,
  Typography,
  VStack,
  type PaperProps,
} from "@its/glowup-ui";

const props: Partial<PaperProps> = {
  elevation: 2,
};

const TOTAL = 50;

export default function PaperExample() {
  const [used, setUsed] = useState(42);

  return (
    <Paper {...props}>
      <VStack spacing="m">
        <VStack spacing="xs">
          <Typography variant="titleMedium">Storage</Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            {`${used} GB of ${TOTAL} GB used`}
          </Typography>
        </VStack>
        <LinearProgress
          progress={used / TOTAL}
          label={`${Math.round((used / TOTAL) * 100)}%`}
        />
        <Button
          variant="tonal"
          iconName="broom"
          disabled={used <= 6}
          onClick={() => setUsed(used - 6)}
        >
          Free up space
        </Button>
      </VStack>
    </Paper>
  );
}
