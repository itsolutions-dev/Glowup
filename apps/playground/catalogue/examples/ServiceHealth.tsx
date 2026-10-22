import { useState } from "react";
import { ChipGroup, Stat, Typography, VStack } from "@its/glowup-ui";

const SERVICES = [
  { value: "api", label: "API" },
  { value: "web", label: "Web app" },
  { value: "worker", label: "Worker" },
];

// Latency and errors are good when they fall, uptime when it rises: each row
// says which colour its trend gets.
const HEALTH = {
  api: [
    { label: "Uptime", value: "99.98%", delta: "0.02%", trend: "up" },
    {
      label: "p95 latency",
      value: "182 ms",
      delta: "14 ms",
      trend: "down",
      trendColor: "success",
    },
    {
      label: "Error rate",
      value: "0.31%",
      delta: "0.05%",
      trend: "up",
      trendColor: "error",
    },
    { label: "Requests", value: "1.2M", delta: "0.0%", trend: "flat" },
  ],
  web: [
    { label: "Uptime", value: "100%", delta: "0.0%", trend: "flat" },
    {
      label: "p95 latency",
      value: "640 ms",
      delta: "90 ms",
      trend: "up",
      trendColor: "error",
    },
    {
      label: "Error rate",
      value: "0.08%",
      delta: "0.02%",
      trend: "down",
      trendColor: "success",
    },
    { label: "Requests", value: "480K", delta: "3.4%", trend: "up" },
  ],
  worker: [
    { label: "Uptime", value: "99.71%", delta: "0.20%", trend: "down" },
    {
      label: "p95 latency",
      value: "2.4 s",
      delta: "0.1 s",
      trend: "down",
      trendColor: "success",
    },
    {
      label: "Error rate",
      value: "1.90%",
      delta: "0.60%",
      trend: "up",
      trendColor: "error",
    },
    { label: "Requests", value: "86K", delta: "12%", trend: "down" },
  ],
} as const;

export default function ServiceHealth() {
  const [service, setService] = useState<string>("api");

  return (
    <VStack spacing="m">
      <ChipGroup
        required
        accessibilityLabel="Service"
        options={SERVICES}
        value={service}
        onChange={setService}
      />
      <VStack spacing="s" dividers>
        {HEALTH[service as keyof typeof HEALTH].map((stat) => (
          <Stat key={stat.label} direction="row" {...stat} />
        ))}
      </VStack>
      <Typography variant="bodySmall" color="onSurfaceVariant">
        Compared with the previous 24 hours.
      </Typography>
    </VStack>
  );
}
