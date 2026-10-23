import { useState } from "react";
import {
  Button,
  RadioGroup,
  Typography,
  VStack,
  type RadioGroupProps,
  type RadioOption,
} from "@its/glowup-ui";

const props: Partial<RadioGroupProps> = {
  label: "Payment method",
};

const METHODS: RadioOption[] = [
  { id: "card", label: "Credit card", value: "card" },
  { id: "paypal", label: "PayPal", value: "paypal" },
  { id: "transfer", label: "Bank transfer", value: "transfer" },
  {
    id: "wallet",
    label: "Wallet (not available in your country)",
    value: "wallet",
    disabled: true,
  },
];

export default function RadioGroupExample() {
  const [method, setMethod] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const label = METHODS.find((option) => option.value === method)?.label;

  return (
    <VStack spacing="m" align="flex-start">
      <Typography variant="titleMedium">Checkout</Typography>
      <RadioGroup
        {...props}
        options={METHODS}
        value={method}
        onValueChange={(value) => {
          setMethod(value);
          setPaid(false);
        }}
      />
      <Button disabled={!method} onClick={() => setPaid(true)}>
        Pay €49.00
      </Button>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {paid
          ? `Paid with ${label?.toLowerCase()}. Thank you!`
          : "Choose a method to continue."}
      </Typography>
    </VStack>
  );
}
