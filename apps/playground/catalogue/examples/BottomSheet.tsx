import { useState } from "react";
import {
  BottomSheet,
  Button,
  ListItem,
  Typography,
  VStack,
  type BottomSheetProps,
} from "@its/glowup-ui";

const props: Partial<BottomSheetProps> = {
  title: "Sort by",
  showCloseButton: true,
};

const SORTS = [
  { id: "newest", label: "Newest first", icon: "clock-outline" },
  {
    id: "price-low",
    label: "Price: low to high",
    icon: "sort-numeric-ascending",
  },
  { id: "rating", label: "Best rated", icon: "star-outline" },
] as const;

export default function BottomSheetExample() {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const current = SORTS.find((option) => option.id === sort);

  return (
    <VStack spacing="m" align="center">
      <VStack spacing="xs" align="center">
        <Typography variant="titleMedium">Running shoes</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          128 results, sorted by {current?.label.toLowerCase()}
        </Typography>
      </VStack>
      <Button variant="tonal" iconName="sort" onClick={() => setOpen(true)}>
        Sort
      </Button>
      <BottomSheet {...props} visible={open} onClose={() => setOpen(false)}>
        {SORTS.map((option) => (
          <ListItem
            key={option.id}
            icon={option.icon}
            primaryText={option.label}
            action={
              option.id === sort ? (
                <Typography variant="labelLarge" color="primary">
                  Selected
                </Typography>
              ) : undefined
            }
            onClick={() => {
              setSort(option.id);
              setOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </VStack>
  );
}
