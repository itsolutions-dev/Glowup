import {
  Divider,
  HStack,
  StatusBadge,
  Typography,
  VStack,
  type StatusBadgeProps,
} from "@its/glowup-ui";

const props: Partial<StatusBadgeProps> & Pick<StatusBadgeProps, "label"> = {
  label: "Paid",
  type: "success",
};

const NEXT = {
  success: "Nothing to do: the payment cleared on 12 November.",
  warning: "The payment is due in 3 days. A reminder goes out tomorrow.",
  error: "The card was declined. Ask the client for another one.",
};

export default function StatusBadgeExample() {
  return (
    <VStack spacing="s">
      <HStack justify="space-between" align="center" wrap spacing="s">
        <VStack spacing="xs">
          <Typography variant="titleMedium">INV-2051</Typography>
          <Typography variant="bodySmall" color="onSurfaceVariant">
            Brightside Studio · €1,240.50
          </Typography>
        </VStack>
        <StatusBadge {...props} />
      </HStack>
      <Divider />
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {NEXT[props.type ?? "success"]}
      </Typography>
    </VStack>
  );
}
