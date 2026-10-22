import { useState } from "react";
import { CaptionValue, Grid, Typography, VStack } from "@its/glowup-ui";

const CUSTOMER = {
  id: "CUS-20418",
  name: "Ada Lovelace",
  since: "Customer since March 2019",
  email: "ada.lovelace@example.com",
  phone: "+44 20 7946 0101",
  vat: "",
  plan: "Business, billed yearly",
  address: "12 Crescent Gardens, Bath BA1 2NB, United Kingdom",
};

export default function ContactDetails() {
  const [copied, setCopied] = useState<string | null>(null);
  // On the web the button writes to the clipboard; on a phone it shows only
  // when the app says how to copy, here by reporting the text.
  const copy = { enableCopy: true, onCopy: setCopied };

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleLarge">{CUSTOMER.name}</Typography>
        <CaptionValue omitCaption value={CUSTOMER.since} />
      </VStack>
      <Grid container spacing="m" autoSize={{ xs: 12, sm: 6 }}>
        <CaptionValue caption="Customer ID" value={CUSTOMER.id} {...copy} />
        <CaptionValue caption="Plan" value={CUSTOMER.plan} />
        <CaptionValue caption="Email" value={CUSTOMER.email} {...copy} />
        <CaptionValue caption="Phone" value={CUSTOMER.phone} {...copy} />
        <CaptionValue
          caption="VAT number"
          value={CUSTOMER.vat}
          fallback="Not provided"
        />
        <CaptionValue
          caption="Billing address"
          value={CUSTOMER.address}
          numberOfLines={2}
          showTooltip
        />
      </Grid>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {copied ? `Copied ${copied}` : "Copy a value with its button."}
      </Typography>
    </VStack>
  );
}
