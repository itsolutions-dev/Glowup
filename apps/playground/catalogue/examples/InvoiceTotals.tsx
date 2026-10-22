import { useState } from "react";
import {
  CaptionValue,
  Divider,
  Switch,
  Typography,
  VStack,
} from "@its/glowup-ui";

const LINES = [
  { name: "Standing desk", quantity: 1, price: 429 },
  { name: "Monitor arm", quantity: 2, price: 59.9 },
  { name: "Cable tray", quantity: 1, price: 18.5 },
];

const SHIPPING = 0;
const COUPON_RATE = 0.1;

const euro = (amount: number) => `€${amount.toFixed(2)}`;

// One row of the table: the caption on the left, the value pinned right.
const rowStyle = { width: "100%", justifyContent: "space-between" } as const;

export default function InvoiceTotals() {
  const [coupon, setCoupon] = useState(false);

  const subtotal = LINES.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const discount = coupon ? subtotal * COUPON_RATE : 0;
  const total = subtotal - discount + SHIPPING;

  return (
    <VStack spacing="s">
      <Typography variant="titleMedium">Order summary</Typography>
      <VStack spacing="xs">
        {LINES.map((line) => (
          <CaptionValue
            key={line.name}
            direction="row"
            style={rowStyle}
            caption={`${line.quantity} × ${line.name}`}
            value={euro(line.price * line.quantity)}
          />
        ))}
      </VStack>
      <Divider />
      <VStack spacing="xs">
        <CaptionValue
          direction="row"
          style={rowStyle}
          caption="Subtotal"
          value={euro(subtotal)}
        />
        <CaptionValue
          direction="row"
          style={rowStyle}
          caption="Coupon SPRING10"
          // Empty value: the fallback stands in for it.
          value={discount ? `−${euro(discount)}` : ""}
          fallback="Not applied"
          valueColor={discount ? "success" : "onSurfaceVariant"}
        />
        <CaptionValue
          direction="row"
          style={rowStyle}
          caption="Shipping"
          value={SHIPPING ? euro(SHIPPING) : null}
          fallback="Free"
        />
        <CaptionValue
          direction="row"
          style={rowStyle}
          caption="Total"
          captionColor="onSurface"
          value={euro(total)}
          valueColor="primary"
        />
      </VStack>
      <Switch
        label="Apply coupon SPRING10"
        value={coupon}
        onChange={setCoupon}
      />
    </VStack>
  );
}
