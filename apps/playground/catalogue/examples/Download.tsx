import { useState } from "react";
import {
  Download,
  ListItem,
  Typography,
  VStack,
  type DownloadProps,
} from "@its/glowup-ui";

const props: Partial<DownloadProps> = {
  children: "Export CSV",
  filename: "orders.csv",
};

const ORDERS = [
  { id: "A-1042", customer: "Maya Chen", total: 128.5 },
  { id: "A-1043", customer: "Tomás Ruiz", total: 54 },
  { id: "A-1044", customer: "Priya Nair", total: 212.9 },
];

const csv = [
  "id,customer,total",
  ...ORDERS.map((o) => `${o.id},${o.customer},${o.total.toFixed(2)}`),
].join("\n");

export default function DownloadExample() {
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">Orders</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          Last three orders from the shop.
        </Typography>
      </VStack>
      <VStack spacing="xs">
        {ORDERS.map((order) => (
          <ListItem
            key={order.id}
            icon="receipt-text-outline"
            primaryText={`Order ${order.id}`}
            secondaryText={order.customer}
            action={
              <Typography variant="labelLarge">
                {`€${order.total.toFixed(2)}`}
              </Typography>
            }
          />
        ))}
      </VStack>
      {/* On the web this saves a file. A phone shares the text; a writer
          (`save`) would write a real file there. */}
      <Download
        {...props}
        data={csv}
        onDownload={(file) => setSaved(file.name)}
        style={{ alignSelf: "flex-start" }}
      />
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {saved ? `Saved ${saved}.` : "Nothing exported yet."}
      </Typography>
    </VStack>
  );
}
