import { useState } from "react";
import {
  ButtonGroup,
  Typography,
  VStack,
  type ButtonGroupOption,
  type ButtonGroupProps,
} from "@its/glowup-ui";

const props: Partial<ButtonGroupProps> = {
  type: "connected",
};

const VIEWS: ButtonGroupOption[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const EVENTS: Record<string, string> = {
  day: "3 events today",
  week: "14 events this week",
  month: "52 events this month",
};

export default function ButtonGroupExample() {
  const [view, setView] = useState<string | string[]>("week");
  const picked = [view].flat();

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Schedule</Typography>
      <ButtonGroup
        accessibilityLabel="Calendar view"
        {...props}
        options={VIEWS}
        value={view}
        onValueChange={setView}
      />
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {picked.length
          ? picked.map((key) => EVENTS[key]).join(" · ")
          : "Pick a range to see your events."}
      </Typography>
    </VStack>
  );
}
