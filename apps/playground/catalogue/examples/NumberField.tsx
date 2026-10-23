import { useState } from "react";
import {
  Button,
  Divider,
  HStack,
  NumberField,
  Typography,
  VStack,
  type NumberFieldProps,
} from "@its/glowup-ui";

const props: Partial<NumberFieldProps> = {
  label: "Quantity",
  min: 1,
  max: 10,
};

const UNIT_PRICE = 112;

export default function NumberFieldExample() {
  const [quantity, setQuantity] = useState(2);

  return (
    <VStack spacing="m">
      <Typography variant="titleMedium">Your cart</Typography>
      <HStack spacing="m" align="center" justify="space-between" wrap>
        <VStack spacing="xs">
          <Typography variant="bodyLarge">Trail backpack</Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            {`€${UNIT_PRICE}.00 each`}
          </Typography>
        </VStack>
        <NumberField {...props} value={quantity} onChange={setQuantity} />
      </HStack>
      <Divider />
      <HStack justify="space-between">
        <Typography variant="titleSmall">Total</Typography>
        <Typography variant="titleSmall">
          {`€${(quantity * UNIT_PRICE).toFixed(2)}`}
        </Typography>
      </HStack>
      <Button>Checkout</Button>
    </VStack>
  );
}
