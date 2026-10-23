import { useState } from "react";
import {
  RadioButton,
  Typography,
  VStack,
  type RadioButtonProps,
} from "@its/glowup-ui";

const props: Partial<RadioButtonProps> = {
  labelPosition: "right",
};

const METHODS = [
  { id: "standard", name: "Standard", detail: "free, 3-5 days" },
  { id: "express", name: "Express", detail: "€9.00, next day" },
  { id: "pickup", name: "Pick up in store", detail: "free, ready in 2 hours" },
  { id: "same-day", name: "Same day", detail: "sold out for today", off: true },
];

export default function RadioButtonExample() {
  const [method, setMethod] = useState("standard");
  const chosen = METHODS.find((item) => item.id === method);

  return (
    <VStack spacing="xs">
      <Typography variant="titleMedium">Delivery</Typography>
      {METHODS.map((item) => (
        <RadioButton
          key={item.id}
          {...props}
          label={`${item.name} (${item.detail})`}
          selected={method === item.id}
          disabled={props.disabled || item.off}
          onPress={() => setMethod(item.id)}
        />
      ))}
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {`Your order ships with ${chosen?.name.toLowerCase()} delivery.`}
      </Typography>
    </VStack>
  );
}
