import { useState } from "react";
import {
  Button,
  Input,
  Rating,
  Typography,
  VStack,
  type RatingProps,
} from "@its/glowup-ui";

const props: Partial<RatingProps> = {
  size: 32,
};

const WORDS = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

export default function RatingExample() {
  const [stars, setStars] = useState(4);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <VStack spacing="m">
      <VStack spacing="xs">
        <Typography variant="titleMedium">How was your stay?</Typography>
        <Typography variant="bodySmall" color="onSurfaceVariant">
          {stars > 0
            ? `${WORDS[Math.ceil(stars) - 1] ?? "Rated"}, ${stars} out of ${props.max ?? 5}`
            : "Tap a star to rate it."}
        </Typography>
      </VStack>
      <Rating
        {...props}
        value={stars}
        onChange={(next) => {
          setStars(next);
          setSent(false);
        }}
      />
      <Input
        label="Tell us more"
        placeholder="Optional"
        value={comment}
        onChange={setComment}
        multiline
        rows={3}
      />
      <Button
        iconName={sent ? "check" : "send-outline"}
        disabled={stars === 0 || sent}
        onClick={() => setSent(true)}
      >
        {sent ? "Thanks for your review" : "Send review"}
      </Button>
    </VStack>
  );
}
