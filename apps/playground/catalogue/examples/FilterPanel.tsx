import { useState } from "react";
import {
  Accordion,
  Button,
  ChipGroup,
  ListItem,
  Typography,
  VStack,
} from "@its/glowup-ui";

const CATEGORIES = ["Audio", "Kitchen", "Outdoor"].map((value) => ({
  value,
  label: value,
}));

const PRICES = [
  { value: "low", label: "Under €50", test: (p: number) => p < 50 },
  {
    value: "mid",
    label: "€50 to €150",
    test: (p: number) => p >= 50 && p <= 150,
  },
  { value: "high", label: "Over €150", test: (p: number) => p > 150 },
];

const PRODUCTS = [
  { id: "p1", name: "Wireless earbuds", category: "Audio", price: 79 },
  { id: "p2", name: "Studio headphones", category: "Audio", price: 189.9 },
  { id: "p3", name: "Pocket speaker", category: "Audio", price: 39 },
  { id: "p4", name: "Espresso machine", category: "Kitchen", price: 249 },
  { id: "p5", name: "Chef's knife", category: "Kitchen", price: 64.5 },
  { id: "p6", name: "Trail backpack", category: "Outdoor", price: 112 },
  { id: "p7", name: "Camping lantern", category: "Outdoor", price: 24.9 },
];

export default function FilterPanel() {
  const [categories, setCategories] = useState<string[]>([]);
  const [price, setPrice] = useState<string | null>(null);
  const range = PRICES.find((p) => p.value === price);

  const results = PRODUCTS.filter(
    (product) =>
      (categories.length === 0 || categories.includes(product.category)) &&
      (!range || range.test(product.price)),
  );
  const active = categories.length + (price ? 1 : 0);

  return (
    <VStack spacing="s">
      <Accordion
        variant="contained"
        title="Category"
        // A node instead of the chevron: what is picked, at a glance.
        icon={
          categories.length ? (
            <Typography variant="labelLarge" color="primary">
              {categories.length} selected
            </Typography>
          ) : (
            "shape-outline"
          )
        }
        expanded
      >
        <ChipGroup
          multiple
          accessibilityLabel="Category"
          options={CATEGORIES}
          value={categories}
          onChange={setCategories}
        />
      </Accordion>
      <Accordion variant="contained" title="Price" icon="currency-eur">
        <ChipGroup
          accessibilityLabel="Price"
          options={PRICES}
          value={price}
          onChange={setPrice}
        />
      </Accordion>
      <VStack spacing="xs">
        <Typography variant="titleSmall">{results.length} products</Typography>
        {results.length === 0 && (
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            No product matches these filters.
          </Typography>
        )}
        {results.map((product) => (
          <ListItem
            key={product.id}
            primaryText={product.name}
            secondaryText={product.category}
            action={
              <Typography variant="labelLarge">
                €{product.price.toFixed(2)}
              </Typography>
            }
          />
        ))}
        <Button
          variant="outlined"
          badge={active}
          disabled={active === 0}
          onClick={() => {
            setCategories([]);
            setPrice(null);
          }}
        >
          Reset filters
        </Button>
      </VStack>
    </VStack>
  );
}
