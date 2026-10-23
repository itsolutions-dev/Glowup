import {
  Blink,
  ListItem,
  StatusBadge,
  VStack,
  type BlinkProps,
} from "@its/glowup-ui";

const props: Partial<BlinkProps> = {
  interval: 700,
  minOpacity: 0.2,
};

export default function BlinkExample() {
  return (
    <VStack>
      <ListItem
        icon="cctv"
        primaryText="Front door"
        secondaryText="Motion at the gate"
        action={
          <Blink {...props}>
            <StatusBadge type="error" label="Recording" />
          </Blink>
        }
      />
      <ListItem
        icon="cctv"
        primaryText="Garage"
        secondaryText="Idle since 18:40"
        action={<StatusBadge type="success" label="Online" />}
      />
      <ListItem
        icon="cctv"
        primaryText="Back garden"
        secondaryText="Weak signal"
        action={<StatusBadge type="warning" label="Unstable" />}
      />
    </VStack>
  );
}
