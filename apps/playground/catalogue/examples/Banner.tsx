import { useState } from "react";
import {
  Banner,
  Button,
  ListItem,
  Typography,
  VStack,
  type BannerProps,
} from "@its/glowup-ui";

const props: Partial<BannerProps> = {
  message: "Your trial ends in 3 days. Add a card to keep your projects.",
  type: "warning",
  dismissable: true,
};

export default function BannerExample() {
  const [visible, setVisible] = useState(true);
  const [card, setCard] = useState(false);

  return (
    <VStack spacing="m">
      <Banner
        {...props}
        visible={visible && !card}
        message={props.message ?? ""}
        onDismiss={() => setVisible(false)}
        actions={[
          { label: "Remind me later", onPress: () => setVisible(false) },
          { label: "Add card", onPress: () => setCard(true) },
        ]}
      />
      <Typography variant="titleMedium">Billing</Typography>
      <ListItem
        icon="credit-card-outline"
        primaryText="Payment method"
        secondaryText={card ? "Visa ending 4242" : "None on file"}
      />
      <ListItem
        icon="calendar-month-outline"
        primaryText="Plan"
        secondaryText={card ? "Team, billed monthly" : "Trial, 3 days left"}
      />
      {(!visible || card) && (
        <Button
          variant="text"
          onClick={() => {
            setVisible(true);
            setCard(false);
          }}
        >
          Show the banner again
        </Button>
      )}
    </VStack>
  );
}
