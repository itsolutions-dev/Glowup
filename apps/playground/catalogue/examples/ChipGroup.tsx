import { useState } from "react";
import {
  ChipGroup,
  ListItem,
  Typography,
  VStack,
  type ChipGroupOption,
  type ChipGroupProps,
} from "@its/glowup-ui";

const props: Partial<ChipGroupProps> = {
  multiple: true,
};

const AMENITIES: ChipGroupOption[] = [
  { value: "wifi", label: "Wi-Fi", icon: "wifi" },
  { value: "parking", label: "Parking", icon: "parking" },
  { value: "pool", label: "Pool", icon: "pool" },
  { value: "pets", label: "Pet friendly", icon: "paw" },
  { value: "gym", label: "Gym", icon: "dumbbell", disabled: true },
];

const STAYS = [
  { name: "Harbour View Hotel", has: ["wifi", "parking", "pool"] },
  { name: "Old Mill Guesthouse", has: ["wifi", "pets"] },
  { name: "Lakeside Cabins", has: ["parking", "pets"] },
  { name: "Central Hostel", has: ["wifi"] },
  { name: "Hilltop Camping", has: [] },
];

export default function ChipGroupExample() {
  const [value, setValue] = useState<string | string[] | null>(["wifi"]);
  const picked = value === null ? [] : [value].flat();
  const shown = STAYS.filter((stay) =>
    picked.every((amenity) => stay.has.includes(amenity)),
  );

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Amenities</Typography>
      <ChipGroup
        accessibilityLabel="Amenities"
        {...props}
        options={AMENITIES}
        value={value}
        onChange={setValue}
      />
      {shown.map((stay) => (
        <ListItem
          key={stay.name}
          primaryText={stay.name}
          secondaryText={stay.has.length ? stay.has.join(", ") : "No extras"}
        />
      ))}
      {shown.length === 0 && (
        <Typography variant="bodyMedium" color="onSurfaceVariant">
          No stay has all of these.
        </Typography>
      )}
    </VStack>
  );
}
