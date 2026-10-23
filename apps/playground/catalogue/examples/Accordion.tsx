import { useState } from "react";
import {
  Accordion,
  Button,
  HStack,
  Typography,
  VStack,
  type AccordionProps,
} from "@its/glowup-ui";

const props: Partial<AccordionProps> = {
  variant: "outlined",
};

const FAQ = [
  {
    id: "plan",
    question: "Can I change my plan later?",
    answer:
      "Yes. Upgrades apply at once and downgrades at the end of the billing period.",
  },
  {
    id: "invoices",
    question: "Where do I find my invoices?",
    answer:
      "Under Settings, then Billing. Every invoice is a PDF with your VAT number on it.",
  },
  {
    id: "export",
    question: "Can I export my data?",
    answer:
      "Any list can be exported as CSV, and the full workspace as a ZIP from the admin page.",
  },
  {
    id: "cancel",
    question: "What happens when I cancel?",
    answer:
      "Your workspace stays read-only for 30 days, then it is deleted for good.",
  },
];

export default function AccordionExample() {
  // One id, so opening a question closes the one that was open.
  const [open, setOpen] = useState<string | null>("plan");

  return (
    <VStack spacing="s">
      <HStack justify="space-between" align="center">
        <Typography variant="titleMedium">Common questions</Typography>
        <Button
          variant="text"
          disabled={open === null}
          onClick={() => setOpen(null)}
        >
          Collapse all
        </Button>
      </HStack>
      {FAQ.map((item) => (
        <Accordion
          {...props}
          key={item.id}
          title={item.question}
          expanded={open === item.id}
          onClick={(expanded) => setOpen(expanded ? item.id : null)}
        >
          {item.answer}
        </Accordion>
      ))}
    </VStack>
  );
}
