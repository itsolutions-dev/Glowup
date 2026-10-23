import { Link, Typography, VStack, type LinkProps } from "@its/glowup-ui";

const props: Partial<LinkProps> & Pick<LinkProps, "children"> = {
  children: "Browse the help centre",
  href: "https://example.com/help",
};

export default function LinkExample() {
  return (
    <VStack spacing="xs">
      <Typography variant="titleMedium">Need a hand?</Typography>
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        The guides cover setup, billing and exports. Most questions are answered
        there.
      </Typography>
      <Link {...props} />
    </VStack>
  );
}
