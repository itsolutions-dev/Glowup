import { useState } from "react";
import {
  Accordion,
  Box,
  Button,
  ButtonGroup,
  Card,
  Chip,
  Divider,
  HStack,
  Icon,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    blurb: "For side projects and trying things out.",
    monthly: 0,
    features: ["1 project", "Community support", "1 GB storage"],
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "For teams shipping to production.",
    monthly: 24,
    featured: true,
    features: [
      "Unlimited projects",
      "Priority support",
      "100 GB storage",
      "Custom domains",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "For organisations with compliance needs.",
    monthly: 79,
    features: ["Everything in Pro", "SSO and audit log", "99.99% SLA"],
  },
];

const FAQ = [
  {
    q: "Can I change plan later?",
    a: "Yes. Upgrades apply immediately; downgrades at the end of the billing period.",
  },
  {
    q: "Is there a free trial of Pro?",
    a: "Every new workspace gets 14 days of Pro, no card required.",
  },
  {
    q: "How does yearly billing work?",
    a: "You pay for ten months and get twelve. Cancel any time for a pro-rata refund.",
  },
];

/**
 * Plans side by side (stacked when narrow), the recommended one raised with
 * the glow variant. Each plan is a card because it is one choice the reader
 * acts on as a whole; the FAQ underneath is a plain list of accordions.
 */
export default function Pricing() {
  const { theme } = useTheme();
  const [billing, setBilling] = useState("yearly");
  const [chosen, setChosen] = useState("pro");

  const priceOf = (monthly: number) =>
    billing === "yearly" ? Math.round((monthly * 10) / 12) : monthly;

  return (
    <Box
      p="l"
      gap="xl"
      radius="extraLarge"
      bg="surface"
      borderWidth={1}
      borderColor="outlineVariant"
    >
      <VStack spacing="m" align="center">
        <Typography
          variant="headlineMedium"
          style={{ color: theme.colors.onSurface, textAlign: "center" }}
        >
          Simple pricing that grows with you
        </Typography>
        <Typography
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
        >
          Start free. Upgrade when the team does.
        </Typography>
        <ButtonGroup
          type="connected"
          accessibilityLabel="Billing period"
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly · 2 months free" },
          ]}
          value={billing}
          onValueChange={setBilling}
        />
      </VStack>

      <HStack wrap spacing="m" align="stretch">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            variant={plan.featured ? "glow" : "outlined"}
            style={{ flexGrow: 1, flexBasis: 240 }}
          >
            <VStack spacing="m" p="m">
              <HStack justify="space-between" align="center">
                <Typography
                  variant="titleLarge"
                  style={{ color: theme.colors.onSurface }}
                >
                  {plan.name}
                </Typography>
                {plan.featured && (
                  <Chip label="Popular" size="small" icon="star" selected />
                )}
              </HStack>
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {plan.blurb}
              </Typography>
              <HStack align="flex-end" spacing="xs">
                <Typography
                  variant="displaySmall"
                  style={{ color: theme.colors.onSurface }}
                >
                  €{priceOf(plan.monthly)}
                </Typography>
                <Typography
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  / user / month
                </Typography>
              </HStack>
              <Divider />
              <VStack spacing="s">
                {plan.features.map((feature) => (
                  <HStack key={feature} spacing="s" align="center">
                    <Icon
                      source="check-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Typography
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurface }}
                    >
                      {feature}
                    </Typography>
                  </HStack>
                ))}
              </VStack>
              <Button
                mode={chosen === plan.id ? "filled" : "outlined"}
                iconName={chosen === plan.id ? "check" : undefined}
                fullWidth
                onPress={() => setChosen(plan.id)}
              >
                {chosen === plan.id ? "Selected" : `Choose ${plan.name}`}
              </Button>
            </VStack>
          </Card>
        ))}
      </HStack>

      <VStack spacing="s">
        <Typography
          variant="titleLarge"
          style={{ color: theme.colors.onSurface }}
        >
          Frequently asked
        </Typography>
        {FAQ.map((item) => (
          <Accordion key={item.q} title={item.q}>
            <Typography
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.a}
            </Typography>
          </Accordion>
        ))}
      </VStack>
    </Box>
  );
}
