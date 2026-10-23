import { useState } from "react";
import {
  Chip,
  ListItem,
  Typography,
  VStack,
  type ChipProps,
} from "@its/glowup-ui";

const props: Partial<ChipProps> = {
  label: "Free entry",
  icon: "gift-outline",
};

const EVENTS = [
  { name: "Open-air cinema", day: "Friday", price: 0 },
  { name: "Jazz in the park", day: "Saturday", price: 15 },
  { name: "Farmers market", day: "Saturday", price: 0 },
  { name: "Pottery workshop", day: "Sunday", price: 40 },
  { name: "Sunrise run", day: "Sunday", price: 0 },
];

export default function ChipExample() {
  const [freeOnly, setFreeOnly] = useState(false);
  const shown = EVENTS.filter((event) => !freeOnly || event.price === 0);

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">This weekend</Typography>
      <Chip
        label="Free entry"
        {...props}
        selected={freeOnly}
        onClick={() => setFreeOnly(!freeOnly)}
      />
      {shown.map((event) => (
        <ListItem
          key={event.name}
          primaryText={event.name}
          secondaryText={event.day}
          action={
            <Typography variant="labelLarge">
              {event.price ? `€${event.price}` : "Free"}
            </Typography>
          }
        />
      ))}
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {`${shown.length} of ${EVENTS.length} events`}
      </Typography>
    </VStack>
  );
}
