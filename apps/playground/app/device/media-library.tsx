import { useState } from "react";
import { Platform } from "react-native";
import {
  Banner,
  Button,
  HStack,
  Image,
  ListItem,
  ListSection,
  StatusBadge,
  Typography,
  VStack,
  useTheme,
} from "@its/glowup-ui";
import {
  useMediaLibrary,
  type SaveResult,
} from "@its/glowup-device/media-library";
import {
  useMediaPicker,
  type PickedMedia,
} from "@its/glowup-device/media-picker";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

const STATUS: Record<
  SaveResult["status"],
  { label: string; type: "success" | "warning" | "error" }
> = {
  saved: { label: "Saved", type: "success" },
  denied: { label: "Denied", type: "error" },
  unsupported: { label: "Unsupported", type: "warning" },
  failed: { label: "Failed", type: "error" },
};

const USAGE = `import { useMediaLibrary } from "@its/glowup-device/media-library";

function SaveButton({ uri }: { uri: string }) {
  const library = useMediaLibrary();
  if (!library.isSupported) return null; // the web has no photo library
  if (library.status === "denied") {
    return <Button onPress={library.openSettings}>Allow saving in Settings</Button>;
  }
  return (
    <Button
      onPress={async () => {
        const result = await library.save(uri); // asks the first time
        if (result.status === "saved") toast("Saved to Photos");
      }}
    >
      Save to Photos
    </Button>
  );
}`;

export default function MediaLibraryPage() {
  const { theme } = useTheme();
  const library = useMediaLibrary();
  const picker = useMediaPicker();
  const [photo, setPhoto] = useState<PickedMedia | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const choose = () => {
    void picker.pick().then((picked) => {
      if (picked.status !== "picked") return;
      setPhoto(picked.assets[0]);
      setResult(null);
    });
  };

  const save = async () => {
    if (!photo) return;
    setSaving(true);
    try {
      setResult(await library.save(photo.uri));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      eyebrow="@its/glowup-device/media-library"
      title="Media library"
      description="Saving photos and videos to the device's photo library, with the least permission each platform allows. Reading the library is left out on purpose: picking needs no permission at all."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            Platform.OS === "web"
              ? "A browser has no photo library: saving is unsupported here, and the page never loads expo-media-library (its default entry throws at import in a browser). Offer a download instead."
              : Platform.OS === "ios"
                ? "iOS asks for add-only access the first time: the app can add photos but never read them."
                : "Android 11 and later save without asking; Android 10 and earlier ask for storage the first time."
          }
        />
      }
    >
      <Section
        title="Permission"
        description="save() asks by itself the first time. Once refused it answers denied without a prompt, and only the settings undo it."
      >
        {library.isSupported === false ? (
          <StatusBadge label="No photo library here" type="warning" />
        ) : (
          <VStack spacing="s">
            <DevicePermission
              status={library.status}
              canAskAgain={library.canAskAgain}
              isLoading={library.isLoading}
              request={library.request}
              openSettings={library.openSettings}
              requestLabel="Allow saving"
            />
            {library.isRequired === false ? (
              <Typography
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Not required on this device: isRequired is false.
              </Typography>
            ) : null}
          </VStack>
        )}
      </Section>

      <Section
        title="Save a copy"
        description="Choose a photo with /media-picker, then save it back to the library through useMediaLibrary().save(uri)."
      >
        <HStack spacing="m" align="center" wrap>
          <Button
            mode="outlined"
            iconName="image-outline"
            loading={picker.isPicking}
            onPress={choose}
          >
            {photo ? "Choose another" : "Choose a photo"}
          </Button>
          <Button
            iconName="download-outline"
            loading={saving}
            disabled={!photo || library.isSupported !== true}
            onPress={() => void save()}
          >
            Save to Photos
          </Button>
          {result ? (
            <StatusBadge
              label={STATUS[result.status].label}
              type={STATUS[result.status].type}
            />
          ) : null}
        </HStack>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            alt={photo.fileName ?? "Chosen photo"}
            width={240}
            ratio={photo.width && photo.height ? photo.width / photo.height : 1}
            radius="medium"
          />
        ) : null}
        {result ? (
          <ListSection>
            <ListItem
              secondary={
                result.status === "saved"
                  ? result.assetId
                  : result.status === "failed"
                    ? (result.detail ?? "No detail")
                    : STATUS[result.status].label
              }
            >
              {result.status === "saved" ? "Library id" : "Outcome"}
            </ListItem>
          </ListSection>
        ) : null}
      </Section>

      <Section
        title="Wire it up"
        description="The config plugin's mediaLibrary key writes the add-only purpose string and removes Android's media read permissions, which saving does not need and Google Play restricts."
      >
        <CodeBlock
          code="npx expo install expo-media-library @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={USAGE} title="SaveButton.tsx" />
      </Section>
    </Page>
  );
}
