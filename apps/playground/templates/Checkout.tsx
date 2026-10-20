import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  Grid,
  HStack,
  Input,
  ListItem,
  ProgressButton,
  RadioGroup,
  NumberField,
  Typography,
  VStack,
  useTheme,
  type ButtonGroupOption,
} from "@its/glowup-ui";

const DELIVERY = [
  { id: "standard", label: "Standard · 3–5 days · Free", value: "standard" },
  { id: "express", label: "Express · next day · €9.90", value: "express" },
];

const PAYMENT: ButtonGroupOption[] = [
  { value: "card", label: "Card", icon: "credit-card-outline" },
  { value: "paypal", label: "PayPal", icon: "wallet-outline" },
];

const euro = (value: number) => `€${value.toFixed(2)}`;

/**
 * One-page checkout: the form on the left, the order summary on the right
 * (below it when narrow). The pay button carries its own progress, so the
 * reader never loses track of the payment while it runs.
 */
export default function Checkout() {
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("card");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [sameAddress, setSameAddress] = useState(true);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);

  const subtotal = 89 * quantity + 24.5;
  const shipping = delivery === "express" ? 9.9 : 0;
  const total = subtotal + shipping - discount;

  // Stand-in for a payment request: fills the button in five steps.
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(
      () =>
        progress >= 1 ? setStatus("success") : setProgress(progress + 0.25),
      300,
    );
    return () => clearTimeout(timer);
  }, [status, progress]);

  const sectionTitle = (title: string) => (
    <Typography variant="titleMedium" style={{ color: theme.colors.onSurface }}>
      {title}
    </Typography>
  );

  return (
    <Box
      p="l"
      gap="l"
      radius="extraLarge"
      bg="surface"
      borderWidth={1}
      borderColor="outlineVariant"
    >
      <VStack spacing="s">
        <Breadcrumbs
          items={[
            { id: "cart", label: "Cart", onPress: () => {} },
            { id: "checkout", label: "Checkout" },
          ]}
        />
        <Typography
          variant="headlineSmall"
          style={{ color: theme.colors.onSurface }}
        >
          Checkout
        </Typography>
      </VStack>

      <HStack wrap spacing="xl" align="flex-start">
        {/* Form */}
        <VStack spacing="l" style={{ flexGrow: 3, flexBasis: 340 }}>
          <VStack spacing="m">
            {sectionTitle("Shipping address")}
            <Grid columns={2} spacing="m">
              <Input label="First name" value="Ada" onChange={() => {}} />
              <Input label="Last name" value="Lovelace" onChange={() => {}} />
            </Grid>
            <Input
              label="Address"
              value="12 St James's Square"
              onChange={() => {}}
              leadingIcon="map-marker-outline"
            />
            <Grid columns={2} spacing="m">
              <Input label="City" value="London" onChange={() => {}} />
              <Input label="Postcode" value="SW1Y 4LB" onChange={() => {}} />
            </Grid>
            <Checkbox
              checked={sameAddress}
              onValueChange={setSameAddress}
              label="Billing address is the same"
            />
          </VStack>

          <Divider />

          <VStack spacing="m">
            {sectionTitle("Delivery")}
            <RadioGroup
              options={DELIVERY}
              value={delivery}
              onValueChange={setDelivery}
            />
          </VStack>

          <Divider />

          <VStack spacing="m">
            {sectionTitle("Payment")}
            <ButtonGroup
              type="connected"
              accessibilityLabel="Payment method"
              options={PAYMENT}
              value={payment}
              onValueChange={setPayment}
            />
            {payment === "card" ? (
              <VStack spacing="m">
                <Input
                  label="Card number"
                  value=""
                  onChange={() => {}}
                  placeholder="1234 1234 1234 1234"
                  leadingIcon="credit-card-outline"
                />
                <Grid columns={2} spacing="m">
                  <Input
                    label="Expiry"
                    value=""
                    onChange={() => {}}
                    placeholder="MM / YY"
                  />
                  <Input
                    label="CVC"
                    value=""
                    onChange={() => {}}
                    placeholder="123"
                  />
                </Grid>
              </VStack>
            ) : (
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                You will be redirected to PayPal to complete the payment.
              </Typography>
            )}
          </VStack>
        </VStack>

        {/* Summary */}
        <Box
          p="l"
          gap="m"
          radius="large"
          bg="surfaceContainerLow"
          style={{ flexGrow: 2, flexBasis: 280 }}
        >
          {sectionTitle("Order summary")}

          <ListItem
            leading={<Avatar icon="headphones" variant="rounded" size={48} />}
            secondary={`${euro(89)} · Midnight blue`}
          >
            Wireless headphones
          </ListItem>
          <HStack justify="space-between" align="center">
            <Typography
              variant="labelLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Quantity
            </Typography>
            <NumberField
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={9}
            />
          </HStack>
          <ListItem
            leading={<Avatar icon="cable-data" variant="rounded" size={48} />}
            secondary={`${euro(24.5)} · 2 m`}
          >
            USB-C cable
          </ListItem>

          <HStack spacing="s" align="flex-start">
            <Input
              label="Promo code"
              value={promo}
              onChange={setPromo}
              helperText={discount ? "GLOWUP10 applied" : "Try GLOWUP10"}
              style={{ flex: 1 }}
            />
            <Button
              variant="tonal"
              style={{ marginTop: theme.spacing.s }}
              onClick={() =>
                setDiscount(promo.trim().toUpperCase() === "GLOWUP10" ? 10 : 0)
              }
            >
              Apply
            </Button>
          </HStack>

          <Divider />

          {[
            ["Subtotal", euro(subtotal)],
            ["Shipping", shipping ? euro(shipping) : "Free"],
            ...(discount ? [["Discount", `−${euro(discount)}`]] : []),
          ].map(([label, value]) => (
            <HStack key={label} justify="space-between">
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {label}
              </Typography>
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {value}
              </Typography>
            </HStack>
          ))}

          <HStack justify="space-between" align="center">
            <Typography
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Total
            </Typography>
            <Typography
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface }}
            >
              {euro(total)}
            </Typography>
          </HStack>

          <ProgressButton
            fullWidth
            iconName="lock-outline"
            status={status}
            progress={progress}
            loadingLabel="Processing payment…"
            successLabel="Payment complete"
            onClick={() => {
              setProgress(0);
              setStatus("loading");
            }}
            successDuration={0}
          >
            {`Pay ${euro(total)}`}
          </ProgressButton>
        </Box>
      </HStack>
    </Box>
  );
}
