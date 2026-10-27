import { useState } from "react";
import {
  Button,
  CaptionValue,
  GridLayout,
  Paper,
  Typography,
  VStack,
  type GridLayoutProps,
} from "@its/glowup-ui";

const props: Partial<GridLayoutProps> = {
  gap: 16,
};

// Where each panel sits, in columns and rows of a 12-column grid. Row 5 is
// left empty on purpose: the notes start lower down, and the gap stays.
const LAYOUT = [
  { id: "details", x: 0, y: 0, w: 6, h: 4 },
  { id: "contact", x: 6, y: 0, w: 6, h: 2 },
  { id: "call", x: 6, y: 2, w: 6, h: 3 },
  { id: "notes", x: 0, y: 6, w: 12, h: 2 },
];

export default function GridLayoutExample() {
  const [calls, setCalls] = useState(0);

  return (
    <VStack spacing="m">
      <Typography variant="titleLarge">Ada Lovelace</Typography>
      <GridLayout {...props} layout={LAYOUT}>
        <Paper key="details" outline style={{ flexGrow: 1 }}>
          <VStack spacing="s">
            <CaptionValue caption="Tax code" value="LVLDAA15S56Z114L" />
            <CaptionValue caption="City" value="London" />
            <CaptionValue caption="Customer since" value="March 2021" />
          </VStack>
        </Paper>
        <Paper key="contact" outline style={{ flexGrow: 1 }}>
          <CaptionValue caption="Last contact" value="27 October 2026" />
        </Paper>
        <Paper key="call" outline style={{ flexGrow: 1 }}>
          <VStack spacing="s" align="flex-start">
            <Typography variant="bodyMedium" color="onSurfaceVariant">
              {calls === 0
                ? "No call yet today."
                : `${calls} ${calls === 1 ? "call" : "calls"} today.`}
            </Typography>
            <Button
              iconName="phone-outline"
              onClick={() => setCalls((n) => n + 1)}
            >
              Call now
            </Button>
          </VStack>
        </Paper>
        <Paper key="notes" outline style={{ flexGrow: 1 }}>
          <VStack spacing="xs">
            <Typography variant="titleSmall">Notes</Typography>
            <Typography variant="bodyMedium">
              Prefers email in the morning. Renewal due in March.
            </Typography>
          </VStack>
        </Paper>
      </GridLayout>
    </VStack>
  );
}
