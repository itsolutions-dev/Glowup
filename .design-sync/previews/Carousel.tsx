import React from "react";
import { Carousel, Card, Typography, Avatar } from "@glowup/ui";

const frame: React.CSSProperties = {
  width: 380,
  display: "flex",
  flexDirection: "column",
};

const slide: React.CSSProperties = {
  minHeight: 130,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  textAlign: "center",
};

export const Onboarding = () => (
  <div style={frame}>
    <Carousel showDots>
      <Card variant="filled" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Track every shipment
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Live courier updates land in one timeline, no tab hopping.
          </Typography>
        </div>
      </Card>
      <Card variant="filled" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Invoice in two taps
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Turn a delivered order into a sent invoice without retyping it.
          </Typography>
        </div>
      </Card>
      <Card variant="filled" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="titleMedium">
            Share with your team
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Invite teammates as guests and scope them to single projects.
          </Typography>
        </div>
      </Card>
    </Carousel>
  </div>
);

export const WithArrows = () => (
  <div style={frame}>
    <Carousel showArrows showDots>
      <Card variant="outlined" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            €18,420
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Revenue, March 2026
          </Typography>
        </div>
      </Card>
      <Card variant="outlined" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            312
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Orders shipped
          </Typography>
        </div>
      </Card>
      <Card variant="outlined" style={{ width: "100%" }}>
        <div style={slide}>
          <Typography style={{ textAlign: "center" }} variant="headlineSmall">
            4.7 / 5
          </Typography>
          <Typography style={{ textAlign: "center" }} variant="bodySmall">
            Average review score
          </Typography>
        </div>
      </Card>
    </Carousel>
  </div>
);

export const Testimonials = () => (
  <div style={frame}>
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
          <div style={{ ...slide, gap: 10 }}>
            <Avatar name={person.name} size={44} />
            <Typography
              style={{ textAlign: "center" }}
              variant="bodyMedium"
            >{`“${person.quote}”`}</Typography>
            <Typography style={{ textAlign: "center" }} variant="labelSmall">
              {`${person.name} — ${person.role}`}
            </Typography>
          </div>
        </Card>
      ))}
    </Carousel>
  </div>
);
