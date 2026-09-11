// GENERATED — do not edit.
// Source: .design-sync/previews/Carousel.tsx
// Regenerate with `npm run variants -w @its/glowup-playground`.
import React from "react";
import { View, type ViewStyle } from "react-native";
import type { Variant } from "../types";
import { Carousel, Card, Typography, Avatar } from "@its/glowup-ui";

const frame: ViewStyle = {
  width: 380,
  flexDirection: "column",
};

const slide: ViewStyle = {
  minHeight: 130,
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

export const Onboarding = () => (
  <View style={frame}>
    <Carousel showDots>
      <Card variant="filled" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Track every shipment
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Live courier updates land in one timeline, no tab hopping.
          </Typography>
        </View>
      </Card>
      <Card variant="filled" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Invoice in two taps
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Turn a delivered order into a sent invoice without retyping it.
          </Typography>
        </View>
      </Card>
      <Card variant="filled" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Share with your team
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Invite teammates as guests and scope them to single projects.
          </Typography>
        </View>
      </Card>
    </Carousel>
  </View>
);

export const WithArrows = () => (
  <View style={frame}>
    <Carousel showArrows showDots>
      <Card variant="outlined" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            €18,420
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Revenue, March 2026
          </Typography>
        </View>
      </Card>
      <Card variant="outlined" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            312
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Orders shipped
          </Typography>
        </View>
      </Card>
      <Card variant="outlined" style={{ width: "100%" }}>
        <View style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            4.7 / 5
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Average review score
          </Typography>
        </View>
      </Card>
    </Carousel>
  </View>
);

export const Testimonials = () => (
  <View style={frame}>
    <Carousel showDots showArrows>
      {[
        {
          name: "Ada Lovelace",
          role: "Engineering lead, Northwind",
          quote:
            "Rollouts that used to take an afternoon now take a coffee break.",
        },
        {
          name: "Grace Hopper",
          role: "Platform architect, Contoso",
          quote:
            "The audit trail alone paid for the migration in the first quarter.",
        },
      ].map((person) => (
        <Card key={person.name} variant="elevated" style={{ width: "100%" }}>
          <View style={{ ...slide, gap: 10 }}>
            <Avatar name={person.name} size={44} />
            <Typography
              style={{ textAlign: "center" }}
              variant="bodyMedium"
            >{`“${person.quote}”`}</Typography>
            <Typography style={{ textAlign: "center" }} variant="labelSmall">
              {`${person.name} — ${person.role}`}
            </Typography>
          </View>
        </Card>
      ))}
    </Carousel>
  </View>
);

export const variants: Variant[] = [
  {
    name: "Onboarding",
    title: "Onboarding",
    render: Onboarding,
  },
  {
    name: "WithArrows",
    title: "With arrows",
    render: WithArrows,
  },
  {
    name: "Testimonials",
    title: "Testimonials",
    render: Testimonials,
  },
];
