import { useState } from "react";
import {
  ListItem,
  Slider,
  Typography,
  VStack,
  type SliderProps,
} from "@its/glowup-ui";

const props: Partial<SliderProps> = {
  label: "Max price (€)",
  max: 500,
  step: 50,
  showValueLabel: true,
  marks: true,
};

const PRODUCTS = [
  { id: "p1", name: "Pocket speaker", price: 39 },
  { id: "p2", name: "Wireless earbuds", price: 79 },
  { id: "p3", name: "Trail backpack", price: 112 },
  { id: "p4", name: "Studio headphones", price: 190 },
  { id: "p5", name: "Espresso machine", price: 249 },
  { id: "p6", name: "Electric kettle bundle", price: 420 },
];

export default function SliderExample() {
  const [maxPrice, setMaxPrice] = useState(250);
  const shown = PRODUCTS.filter((product) => product.price <= maxPrice);

  return (
    <VStack spacing="m">
      <Slider {...props} value={maxPrice} onValueChange={setMaxPrice} />
      <VStack spacing="xs">
        <Typography variant="titleSmall">
          {`${shown.length} of ${PRODUCTS.length} products`}
        </Typography>
        {shown.length === 0 && (
          <Typography variant="bodyMedium" color="onSurfaceVariant">
            Nothing at that price: raise the limit.
          </Typography>
        )}
        {shown.map((product) => (
          <ListItem
            key={product.id}
            primaryText={product.name}
            action={
              <Typography variant="labelLarge">{`€${product.price}`}</Typography>
            }
          />
        ))}
      </VStack>
    </VStack>
  );
}
