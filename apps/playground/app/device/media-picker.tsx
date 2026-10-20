import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  CardContent,
  Grid,
  HStack,
  Icon,
  Image,
  ListItem,
  ListSection,
  StatusBadge,
  Switch,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@its/glowup-ui";
import {
  useMediaPicker,
  type MediaKind,
  type PickedMedia,
  type PickResult,
} from "@its/glowup-device/media-picker";

import { CodeBlock } from "../../site/CodeBlock";
import { Page, Section } from "../../site/Page";

type Kinds = "image" | "video" | "both";

const KINDS: { value: Kinds; label: string }[] = [
  { value: "image", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "both", label: "Both" },
];

const MEDIA_TYPES: Record<Kinds, MediaKind[]> = {
  image: ["image"],
  video: ["video"],
  both: ["image", "video"],
};

const STATUS: Record<
  PickResult["status"],
  { label: string; type: "success" | "warning" | "error" }
> = {
  picked: { label: "Picked", type: "success" },
  cancelled: { label: "Cancelled", type: "warning" },
  busy: { label: "Busy", type: "warning" },
  unsupported: { label: "Unsupported", type: "error" },
  failed: { label: "Failed", type: "error" },
};

const USAGE = `import { useMediaPicker } from "@its/glowup-device/media-picker";

function AvatarButton() {
  const { pick, isPicking } = useMediaPicker();
  return (
    <Button
      disabled={isPicking}
      // On the web, straight from the press: a browser opens its dialog only in the gesture.
      onClick={async () => {
        const result = await pick({ edit: true, aspect: [1, 1], quality: 0.8 });
        if (result.status === "picked") upload(result.assets[0]);
      }}
    >
      Change photo
    </Button>
  );
}`;

const formatSize = (bytes: number | null) =>
  bytes === null
    ? null
    : bytes >= 1_000_000
      ? `${(bytes / 1_000_000).toFixed(1)} MB`
      : `${Math.round(bytes / 1000)} kB`;

function describe(asset: PickedMedia): string {
  return [
    asset.width && asset.height ? `${asset.width} × ${asset.height}` : null,
    formatSize(asset.fileSize),
    asset.duration === null ? null : `${(asset.duration / 1000).toFixed(1)} s`,
    asset.mimeType,
  ]
    .filter(Boolean)
    .join(" · ");
}

function PickedCard({ asset }: { asset: PickedMedia }) {
  const { theme } = useTheme();
  return (
    <Card variant="outlined">
      {asset.type === "image" ? (
        <Image
          source={{ uri: asset.uri }}
          alt={asset.fileName ?? "Picked photo"}
          ratio={asset.width && asset.height ? asset.width / asset.height : 1}
          radius="medium"
        />
      ) : (
        <View
          style={{
            aspectRatio: 16 / 9,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: theme.shape.medium,
            backgroundColor: theme.colors.surfaceContainerHighest,
          }}
        >
          <Icon
            source="filmstrip"
            size={32}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      )}
      <CardContent>
        <Typography variant="titleSmall" numberOfLines={1}>
          {asset.fileName ?? asset.type}
        </Typography>
        <Typography
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {describe(asset)}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function MediaPickerPage() {
  const picker = useMediaPicker();
  const [kinds, setKinds] = useState<Kinds>("image");
  const [multiple, setMultiple] = useState(false);
  const [limited, setLimited] = useState(false);
  const [edit, setEdit] = useState(false);
  const [result, setResult] = useState<PickResult | null>(null);

  // Android: what the user picked while the system had stopped the app.
  const { getPendingResult } = picker;
  useEffect(() => {
    let active = true;
    void getPendingResult().then((pending) => {
      if (active && pending) setResult(pending);
    });
    return () => {
      active = false;
    };
  }, [getPendingResult]);

  const canEdit = Platform.OS !== "web" && !multiple;

  // Synchronous down to pick(): the web opens its dialog only in the press.
  const pick = () => {
    void picker
      .pick({
        mediaTypes: MEDIA_TYPES[kinds],
        multiple,
        limit: multiple && limited ? 3 : 0,
        edit: canEdit && edit,
      })
      .then(setResult);
  };

  return (
    <Page
      eyebrow="@its/glowup-device/media-picker"
      title="Media picker"
      description="The system photo and video picker. No permission on any platform, every outcome resolved, one pick at a time."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "In a browser this is a file dialog: it cannot be capped, so the limit keeps the first files, and cropping is native only. Picked files are blob: URLs with their File for uploads."
              : "iOS shows its photo picker, Android its Photo Picker: neither asks for a permission. Picked files are copies in the app's cache."
          }
        />
      }
    >
      <Section
        title="Pick"
        description="pick(options) resolves picked, cancelled, busy, unsupported or failed, never throws for an outcome."
      >
        <ToggleButtonGroup
          options={KINDS}
          value={kinds}
          onValueChange={(next: Kinds) => setKinds(next)}
        />
        <ListSection>
          <ListItem
            secondary="multiple: true, in the order picked."
            trailing={<Switch value={multiple} onChange={setMultiple} />}
          >
            Several at once
          </ListItem>
          {multiple ? (
            <ListItem
              secondary="limit: 3 (the web keeps the first three files)."
              trailing={<Switch value={limited} onChange={setLimited} />}
            >
              At most three
            </ListItem>
          ) : null}
          <ListItem
            secondary={
              canEdit
                ? "edit: true, the platform's crop screen."
                : Platform.OS === "web"
                  ? "Native only."
                  : "One item only: not with multiple."
            }
            trailing={
              <Switch
                value={canEdit && edit}
                disabled={!canEdit}
                onChange={setEdit}
              />
            }
          >
            Crop
          </ListItem>
        </ListSection>
        <HStack spacing="m" align="center" wrap>
          <Button
            iconName="image-multiple-outline"
            loading={picker.isPicking}
            disabled={picker.isSupported === false}
            onClick={pick}
          >
            Choose
          </Button>
          {result ? (
            <StatusBadge
              label={STATUS[result.status].label}
              type={STATUS[result.status].type}
            />
          ) : null}
        </HStack>
        {result?.status === "failed" && result.detail ? (
          <Typography variant="bodySmall">{result.detail}</Typography>
        ) : null}
      </Section>

      {result?.status === "picked" ? (
        <Section title={`Picked (${result.assets.length})`}>
          <Grid minChildWidth={160} spacing="m">
            {result.assets.map((asset) => (
              <PickedCard key={asset.uri} asset={asset} />
            ))}
          </Grid>
        </Section>
      ) : null}

      <Section
        title="Wire it up"
        description="On Android the system may stop the app behind the picker: call getPendingResult() once at start-up to receive what was picked."
      >
        <CodeBlock
          code="npx expo install expo-image-picker @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="AvatarButton.tsx" />
      </Section>
    </Page>
  );
}
