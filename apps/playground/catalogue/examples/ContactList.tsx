import { useState } from "react";
import {
  Avatar,
  ChipGroup,
  EmptyState,
  IconButton,
  ListItem,
  Typography,
  VStack,
} from "@its/glowup-ui";

const CONTACTS = [
  {
    id: "c1",
    name: "Ada Lovelace",
    role: "Mathematician",
    phone: "+44 20 7946 0101",
    status: "online",
  },
  {
    id: "c2",
    name: "Grace Hopper",
    role: "Rear Admiral, US Navy",
    phone: "+1 202 555 0114",
    status: "busy",
  },
  {
    id: "c3",
    name: "Katherine Johnson",
    role: "Mathematician",
    phone: "+1 757 555 0172",
    status: "away",
  },
  {
    id: "c4",
    name: "Hedy Lamarr",
    role: "Inventor and actress",
    phone: "",
    status: "offline",
  },
  {
    id: "c5",
    name: "Margaret Hamilton",
    role: "Software engineer",
    phone: "+1 617 555 0138",
    status: "online",
  },
] as const;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "favourites", label: "Favourites", icon: "star-outline" },
] as const;

export default function ContactList() {
  const [filter, setFilter] = useState<string>("all");
  const [favourites, setFavourites] = useState<string[]>(["c1"]);
  const [picked, setPicked] = useState<(typeof CONTACTS)[number] | null>(null);

  const toggle = (id: string) =>
    setFavourites((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );
  const shown = CONTACTS.filter(
    (contact) => filter === "all" || favourites.includes(contact.id),
  );

  return (
    <VStack spacing="xs">
      <ChipGroup
        required
        accessibilityLabel="Show"
        options={[...FILTERS]}
        value={filter}
        onChange={setFilter}
      />
      {shown.length === 0 && (
        <EmptyState
          icon="star-outline"
          title="No favourites yet"
          description="Star a contact to keep them here."
        />
      )}
      {shown.map((contact) => (
        <ListItem
          key={contact.id}
          icon={<Avatar name={contact.name} status={contact.status} />}
          primaryText={contact.name}
          secondaryText={contact.role}
          onClick={() => setPicked(contact)}
          action={
            <IconButton
              icon={favourites.includes(contact.id) ? "star" : "star-outline"}
              selected={favourites.includes(contact.id)}
              accessibilityLabel={`Favourite ${contact.name}`}
              onClick={() => toggle(contact.id)}
            />
          }
        />
      ))}
      <Typography variant="bodySmall" color="onSurfaceVariant">
        {picked
          ? `${picked.name}: ${picked.phone || "no number on file"}`
          : "Press a contact to see their number."}
      </Typography>
    </VStack>
  );
}
