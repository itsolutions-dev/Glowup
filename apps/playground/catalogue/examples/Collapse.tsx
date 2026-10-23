import { useState } from "react";
import {
  Button,
  CaptionValue,
  Card,
  Collapse,
  Divider,
  HStack,
  Typography,
  VStack,
  type CollapseProps,
} from "@its/glowup-ui";

const props: Partial<CollapseProps> = {
  collapsedHeight: 0,
  duration: 250,
};

export default function CollapseExample() {
  const [open, setOpen] = useState(false);

  return (
    <Card variant="outlined">
      <VStack spacing={0}>
        <HStack justify="space-between" align="center" wrap spacing="s">
          <VStack>
            <Typography variant="titleMedium">Order #1042</Typography>
            <Typography variant="bodySmall" color="onSurfaceVariant">
              Shipped, arriving Thursday
            </Typography>
          </VStack>
          <Button
            variant="text"
            iconName={open ? "chevron-up" : "chevron-down"}
            iconPosition="end"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide details" : "Show details"}
          </Button>
        </HStack>
        <Collapse {...props} open={open}>
          <VStack spacing="s">
            <Divider />
            <CaptionValue caption="Carrier" value="Northline Express" />
            <CaptionValue caption="Tracking number" value="NX 4821 0067 19" />
            <CaptionValue
              caption="Delivery address"
              value="14 Harbour Street, Springfield"
              numberOfLines={2}
            />
          </VStack>
        </Collapse>
      </VStack>
    </Card>
  );
}
