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
  type MaterialCommunityIconsGlyphs,
} from "@its/glowup-ui";

interface Product {
  name: string;
  price: string;
  icon: MaterialCommunityIconsGlyphs;
}

const SHELVES: Record<string, Product[]> = {
  Audio: [
    { name: "Studio headphones", price: "€129.00", icon: "headphones" },
    { name: "Desk speaker", price: "€79.00", icon: "speaker" },
    { name: "USB microphone", price: "€94.50", icon: "microphone" },
  ],
  Desk: [
    { name: "Mechanical keyboard", price: "€149.00", icon: "keyboard" },
    { name: "Wireless mouse", price: "€39.90", icon: "mouse" },
    { name: "Reading lamp", price: "€54.00", icon: "desk-lamp" },
  ],
  Travel: [
    { name: "Commuter backpack", price: "€88.00", icon: "bag-personal" },
    { name: "Insulated bottle", price: "€24.00", icon: "bottle-soda" },
    { name: "Travel adapter", price: "€19.90", icon: "power-plug" },
  ],
};

const CATEGORIES = Object.keys(SHELVES).map((name) => ({
  value: name,
  label: name,
}));

export default function ProductGrid() {
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

      {/* autoSize: one card per row on a phone, two from 600 dp, three from 840. */}
      <Grid container autoSize spacing="m">
        {shown.map(({ name, price, icon }) => (
          <Card key={name} variant="outlined" style={{ flex: 1 }}>
            <VStack spacing="s">
              <Box
                variant="centered-flex"
                height={96}
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
