import { View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  CardCover,
  CardTitle,
  Chip,
  IconButton,
  Typography,
} from "@its/glowup-ui";
import type { Variant } from "../types";
import { demo, gradientCover } from "./shared";

// Hand-written because the authored previews cover Card as a whole and never
// its four parts on their own. Each part has a catalogue page, so each gets a
// gallery showing what it contributes to the composition.

const COVER = gradientCover("#6750A4", "#B3261E");

const TitleBasic = () => (
  <View style={demo.panel}>
    <Card variant="outlined">
      <CardTitle title="Invoice #1042" subtitle="Acme Inc. · due 12 Oct" />
    </Card>
  </View>
);

const TitleWithSlots = () => (
  <View style={demo.panel}>
    <Card variant="outlined">
      <CardTitle
        title="Marta Rossi"
        subtitle="Lead product designer"
        left={<Avatar name="Marta Rossi" size={40} status="online" />}
        right={
          <IconButton
            icon="dots-vertical"
            accessibilityLabel="More"
            onPress={() => {}}
          />
        }
      />
    </Card>
    <Card variant="filled">
      <CardTitle
        title="A title long enough that it has to be truncated somewhere"
        subtitle="Two lines of subtitle are allowed before this one is clipped too, which is what subtitleNumberOfLines controls."
      />
    </Card>
  </View>
);

const ContentBody = () => (
  <View style={demo.panel}>
    <Card variant="outlined">
      <CardTitle title="Invite your team" subtitle="Workspace · Acme Inc." />
      <CardContent>
        <Typography variant="bodyMedium">
          Everyone you invite gets read access to the shared component library.
          You can raise their role later from Settings.
        </Typography>
      </CardContent>
    </Card>
  </View>
);

const ContentWithChildren = () => (
  <View style={demo.panel}>
    <Card variant="filled">
      <CardTitle title="Filters" />
      <CardContent>
        <View style={demo.row}>
          <Chip label="Paid" mode="tonal" selected onPress={() => {}} />
          <Chip label="Overdue" mode="tonal" onPress={() => {}} />
          <Chip label="Draft" mode="tonal" onPress={() => {}} />
        </View>
      </CardContent>
    </Card>
  </View>
);

const CoverRatios = () => (
  <View style={demo.panel}>
    <Card variant="elevated">
      <CardCover source={COVER} alt="Gradient artwork" />
      <CardTitle title="16:9 — the default" />
    </Card>
    <Card variant="elevated">
      <CardCover source={COVER} alt="Gradient artwork" ratio={1} />
      <CardTitle title="1:1 — square" />
    </Card>
  </View>
);

const ActionAlignment = () => (
  <View style={demo.panel}>
    {(["end", "start", "space-between"] as const).map((align) => (
      <Card key={align} variant="outlined">
        <CardTitle title={`align="${align}"`} />
        <CardActions align={align}>
          <Button mode="text" onPress={() => {}}>
            Not now
          </Button>
          <Button mode="filled" iconName="check" onPress={() => {}}>
            Confirm
          </Button>
        </CardActions>
      </Card>
    ))}
  </View>
);

const Composed = () => (
  <View style={demo.panel}>
    <Card variant="elevated">
      <CardCover source={COVER} alt="Gradient artwork" />
      <CardTitle
        title="Quarterly report"
        subtitle="Published 3 days ago"
        left={<Avatar name="Ada Lovelace" size={36} />}
      />
      <CardContent>
        <Typography variant="bodyMedium">
          All four parts in one composition: cover, header, body, action row.
        </Typography>
      </CardContent>
      <CardActions>
        <Button mode="text" onPress={() => {}}>
          Share
        </Button>
        <Button mode="tonal" iconName="download" onPress={() => {}}>
          Download
        </Button>
      </CardActions>
    </Card>
  </View>
);

export const cardTitleVariants: Variant[] = [
  { name: "TitleBasic", title: "Title and subtitle", render: TitleBasic },
  {
    name: "TitleWithSlots",
    title: "Leading and trailing slots",
    description:
      "`left` and `right` take any node — an Avatar, an overflow menu — and the text truncates rather than pushing them out.",
    render: TitleWithSlots,
  },
  { name: "Composed", title: "In a whole card", render: Composed },
];

export const cardContentVariants: Variant[] = [
  { name: "ContentBody", title: "Body copy", render: ContentBody },
  {
    name: "ContentWithChildren",
    title: "Any children",
    description: "It is a padded slot, not a text block.",
    render: ContentWithChildren,
  },
  { name: "Composed", title: "In a whole card", render: Composed },
];

export const cardCoverVariants: Variant[] = [
  {
    name: "CoverRatios",
    title: "Ratios",
    description:
      "The cover keeps its aspect ratio as the card resizes; 16:9 is the default.",
    render: CoverRatios,
  },
  { name: "Composed", title: "In a whole card", render: Composed },
];

export const cardActionsVariants: Variant[] = [
  {
    name: "ActionAlignment",
    title: "Alignment",
    description:
      "Actions sit at the end by default — the position a reader's thumb and eye both end up.",
    render: ActionAlignment,
  },
  { name: "Composed", title: "In a whole card", render: Composed },
];
