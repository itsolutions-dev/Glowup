import { useState } from "react";
import {
  Box,
  Button,
  Card,
  ChipGroup,
  Grid,
  HStack,
  Icon,
  Typography,
  VStack,
  useTheme,
  type GridProps,
  type MaterialCommunityIconsGlyphs,
} from "@its/glowup-ui";

const props: Partial<GridProps> = {
  container: true,
  spacing: "m",
  autoSize: true,
};

interface Product {
  name: string;
  price: string;
  icon: MaterialCommunityIconsGlyphs;
}

const SHELVES: Record<string, Product[]> = {
  Audio: [
    { name: "Studio headphones", price: "€129.00", icon: "headphones" },
    { name: "Desk speaker", price: "€79.00", icon: "speaker" },
  ],
  Desk: [
    { name: "Mechanical keyboard", price: "€149.00", icon: "keyboard" },
    { name: "Wireless mouse", price: "€39.90", icon: "mouse" },
  ],
  Travel: [
    { name: "Commuter backpack", price: "€88.00", icon: "bag-personal" },
    { name: "Travel adapter", price: "€19.90", icon: "power-plug" },
  ],
};

const CATEGORIES = Object.keys(SHELVES).map((name) => ({
  value: name,
  label: name,
}));

export default function GridExample() {
  const { theme } = useTheme();
  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<string[]>([]);

  const shown = Object.entries(SHELVES).flatMap(([name, products]) =>
    !category || category === name ? products : [],
  );
  const toggle = (name: string) =>
    setCart((now) =>
      now.includes(name) ? now.filter((n) => n !== name) : [...now, name],
    );

  return (
    <VStack spacing="m">
      <HStack justify="space-between" align="center" wrap spacing="s">
        <ChipGroup
          accessibilityLabel="Category"
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />
        <Typography variant="labelLarge" color="onSurfaceVariant">
          {cart.length} in cart
        </Typography>
      </HStack>

      {/* autoSize sizes every child that has no size of its own. */}
      <Grid {...props}>
        {/* An item with a size of its own keeps it: a full row. */}
        <Grid size={12}>
          <Box
            background="tertiaryContainer"
            radius="medium"
            padding={theme.spacing.m}
          >
            <Typography variant="labelLarge" color="onTertiaryContainer">
              Free shipping on orders over €50
            </Typography>
          </Box>
        </Grid>
        {shown.map(({ name, price, icon }) => (
          <Card key={name} variant="outlined" style={{ flex: 1 }}>
            <VStack spacing="s">
              <Box
                variant="centered-flex"
                padding={theme.spacing.l}
                radius="medium"
                background="secondaryContainer"
              >
                <Icon
                  source={icon}
                  size={40}
                  color={theme.colors.onSecondaryContainer}
                />
              </Box>
              <VStack spacing="xs">
                <Typography variant="titleSmall">{name}</Typography>
                <Typography variant="bodyMedium" color="onSurfaceVariant">
                  {price}
                </Typography>
              </VStack>
              <Button
                variant={cart.includes(name) ? "tonal" : "outlined"}
                iconName={cart.includes(name) ? "check" : "cart-plus"}
                onClick={() => toggle(name)}
              >
                {cart.includes(name) ? "In cart" : "Add to cart"}
              </Button>
            </VStack>
          </Card>
        ))}
      </Grid>
    </VStack>
  );
}
