import { useState } from "react";
import {
  Carousel,
  Icon,
  Typography,
  VStack,
  useTheme,
  type CarouselProps,
} from "@its/glowup-ui";

const props: Partial<CarouselProps> = {
  showDots: true,
  showArrows: true,
};

const SLIDES = [
  {
    icon: "calendar-check-outline",
    title: "Plan your week",
    text: "Drag a task onto a day and it moves with you.",
    background: "primaryContainer",
    color: "onPrimaryContainer",
  },
  {
    icon: "bell-ring-outline",
    title: "Stay in the loop",
    text: "Get a nudge before a deadline, never a flood.",
    background: "secondaryContainer",
    color: "onSecondaryContainer",
  },
  {
    icon: "chart-line",
    title: "See your progress",
    text: "A weekly summary shows what you finished.",
    background: "tertiaryContainer",
    color: "onTertiaryContainer",
  },
] as const;

export default function CarouselExample() {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);

  return (
    <VStack spacing="s">
      <Carousel {...props} onIndexChange={setIndex}>
        {SLIDES.map((slide) => (
          <VStack
            key={slide.title}
            align="center"
            spacing="s"
            padding={theme.spacing.xl}
            radius="large"
            background={slide.background}
          >
            <Icon
              source={slide.icon}
              size={theme.spacing.xl}
              color={theme.colors[slide.color]}
            />
            <Typography
              variant="titleMedium"
              color={slide.color}
              align="center"
            >
              {slide.title}
            </Typography>
            <Typography variant="bodyMedium" color={slide.color} align="center">
              {slide.text}
            </Typography>
          </VStack>
        ))}
      </Carousel>
      <Typography variant="labelMedium" color="onSurfaceVariant" align="center">
        {`Step ${index + 1} of ${SLIDES.length}`}
      </Typography>
    </VStack>
  );
}
