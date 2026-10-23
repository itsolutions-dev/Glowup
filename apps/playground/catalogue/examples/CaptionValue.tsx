import { useState } from "react";
import {
  CaptionValue,
  Grid,
  Typography,
  VStack,
  type CaptionValueProps,
} from "@its/glowup-ui";

const props: Partial<CaptionValueProps> = {
  caption: "Email",
  value: "ada.lovelace@example.com",
  enableCopy: true,
};

const OTHERS: Partial<CaptionValueProps>[] = [
  { caption: "Customer ID", value: "CUS-20418", enableCopy: true },
  { caption: "Plan", value: "Business, billed yearly" },
  { caption: "Phone", value: "+44 20 7946 0101", enableCopy: true },
  // Empty value: the fallback stands in for it.
  { caption: "VAT number", value: "", fallback: "Not provided" },
  {
    caption: "Billing address",
    value: "12 Crescent Gardens, Bath BA1 2NB, United Kingdom",
    numberOfLines: 2,
    showTooltip: true,
  },
];

export default function CaptionValueExample() {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <VStack spacing="m">
      <Typography variant="titleLarge">Ada Lovelace</Typography>
      <Grid container spacing="m" autoSize={{ xs: 12, sm: 6 }}>
        {[props, ...OTHERS].map((detail) => (
          // On the web the copy button writes to the clipboard; on a phone it
          // shows only when the app says how to copy, here by reporting the text.
          <CaptionValue
            key={String(detail.caption)}
            {...detail}
            onCopy={setCopied}
          />
        ))}
      </Grid>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {copied ? `Copied ${copied}` : "Copy a value with its button."}
      </Typography>
    </VStack>
  );
}
