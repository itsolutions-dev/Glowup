import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Banner,
  EmptyState,
  HStack,
  IconButton,
  Image,
  ListItem,
  ListSection,
  Paper,
  StatusBadge,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";
import {
  CameraView,
  useCameraPermission,
  type CameraError,
  type CameraFacing,
  type CameraHandle,
  type CapturedPicture,
  type RecordedVideo,
  type ScannedBarcode,
} from "@its/glowup-device/camera";

import { CodeBlock } from "../../site/CodeBlock";
import { DevicePermission } from "../../site/DevicePermission";
import { Page, Section } from "../../site/Page";

type Mode = "scan" | "photo" | "video";
type FlashSetting = "off" | "on" | "auto";

// Video recording is native only: expo-camera's web build cannot record.
const CAN_RECORD = Platform.OS !== "web";
const MAX_SECONDS = 30;

const MODES: {
  value: Mode;
  label: string;
  icon: "qrcode-scan" | "camera-outline" | "video-outline";
  disabled?: boolean;
}[] = [
  { value: "scan", label: "Scan", icon: "qrcode-scan" },
  { value: "photo", label: "Photo", icon: "camera-outline" },
  {
    value: "video",
    label: "Video",
    icon: "video-outline",
    disabled: !CAN_RECORD,
  },
];

const NEXT_FLASH: Record<FlashSetting, FlashSetting> = {
  off: "auto",
  auto: "on",
  on: "off",
};
const FLASH_ICON = {
  off: "flash-off",
  auto: "flash-auto",
  on: "flash-outline",
} as const;

const RECIPE = `const camera = useRef<CameraHandle>(null);
const permission = useCameraPermission({ microphone: mode === "video" });
const [active, setActive] = useState(true);
useFocusEffect(useCallback(() => {
  setActive(true);
  return () => setActive(false); // pause the preview off-screen
}, []));

if (permission.status !== "granted") {
  return <EmptyState icon="camera-outline" title="Camera access"
    action={{ label: "Allow the camera", onPress: permission.request }} />;
}

return (
  <CameraView
    ref={camera}
    active={active}
    facing={facing}
    flash={flash}
    mode={mode === "video" ? "video" : "picture"}
    onBarcodeScanned={mode === "scan" ? setLastCode : undefined}
    onReady={() => setReady(true)}
    style={styles.preview}
  >
    {/* Material controls, drawn over the preview */}
    <IconButton icon="camera-flip-outline" variant="tonal"
      accessibilityLabel="Switch camera" onClick={flip} />
    <IconButton icon="camera-iris" variant="filled" size="large"
      accessibilityLabel="Take a photo" disabled={!ready}
      onClick={async () => setPicture(await camera.current?.takePicture())} />
  </CameraView>
);`;

const PLUGIN = `["@its/glowup-device", {
  camera: {
    cameraPermission: "Scans the QR code on your ticket.",
    microphonePermission: "Records your voice in video reviews.",
    recordAudio: true, // only to record sound with videos
  },
}]`;

type Result =
  | { kind: "code"; barcode: ScannedBarcode; at: number }
  | { kind: "picture"; picture: CapturedPicture }
  | { kind: "video"; video: RecordedVideo };

export default function CameraPage() {
  const [mode, setMode] = useState<Mode>("scan");
  const permission = useCameraPermission({ microphone: mode === "video" });

  return (
    <Page
      eyebrow="@its/glowup-device/camera"
      title="Camera"
      description="A headless CameraView — the preview and nothing else — with photos, video and QR scanning through its ref and props. The recipe below draws Material controls over it with Glowup components."
      banner={
        <Banner
          visible
          type="info"
          icon="information-outline"
          message={
            CAN_RECORD
              ? "Works in Expo Go. Video asks for the microphone too, and only after the camera is allowed. Simulators have no camera: the preview reports “unavailable”."
              : "In a browser the preview, photos and QR scanning work over HTTPS; video recording is native only, so Video is off here."
          }
        />
      }
    >
      <Section
        title="Permission"
        description={
          mode === "video"
            ? "Video records sound: the camera first, then the microphone. The status is the weaker of the two."
            : "Only the camera. Switch to Video to see the microphone join in."
        }
      >
        <DevicePermission
          status={permission.status}
          canAskAgain={permission.canAskAgain}
          isLoading={permission.isLoading}
          request={permission.request}
          openSettings={permission.openSettings}
          requestLabel={
            mode === "video"
              ? "Allow camera and microphone"
              : "Allow the camera"
          }
        >
          {permission.microphone ? (
            <StatusBadge
              label={`Microphone: ${permission.microphone.status}`}
              type={
                permission.microphone.status === "granted"
                  ? "success"
                  : "warning"
              }
            />
          ) : null}
        </DevicePermission>
      </Section>

      <Section
        title="Recipe"
        description="Scan reports each QR code once per second while it stays in view; Photo and Video capture through the ref. The preview pauses when you leave the page."
      >
        <ToggleButtonGroup
          options={MODES}
          value={mode}
          onValueChange={(next: Mode) => setMode(next)}
        />
        <CameraRecipe
          mode={mode}
          granted={permission.status === "granted"}
          unsupported={permission.status === "unsupported"}
          onAllow={permission.request}
        />
      </Section>

      <Section
        title="Wire it up"
        description="CameraView never asks for the permission and draws no controls: gate it on useCameraPermission() and put your own UI in its children."
      >
        <CodeBlock
          code="npx expo install expo-camera @its/glowup-device"
          language="bash"
          title="Terminal"
        />
        <CodeBlock code={PLUGIN} title="app.config.ts → plugins" />
        <CodeBlock code={RECIPE} title="CameraScreen.tsx" />
      </Section>
    </Page>
  );
}

const CameraRecipe = ({
  mode,
  granted,
  unsupported,
  onAllow,
}: {
  mode: Mode;
  granted: boolean;
  unsupported: boolean;
  onAllow: () => Promise<unknown>;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const camera = useRef<CameraHandle>(null);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>("back");
  const [flash, setFlash] = useState<FlashSetting>("off");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState<CameraError | null>(null);

  // A preview off-screen still drains the battery: pause it while the page is
  // not focused, without unmounting it.
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, []),
  );

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      500,
    );
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [recording]);

  const onScanned = useCallback(
    (barcode: ScannedBarcode) =>
      setResult({ kind: "code", barcode, at: Date.now() }),
    [],
  );

  const takePicture = async () => {
    setBusy(true);
    setFailure(null);
    try {
      const picture = await camera.current?.takePicture({ quality: 0.8 });
      if (picture) setResult({ kind: "picture", picture });
    } catch (error) {
      setFailure(error as CameraError);
    } finally {
      setBusy(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      camera.current?.stopRecording();
      return;
    }
    setFailure(null);
    setRecording(true);
    try {
      const video = await camera.current?.recordVideo({
        maxDuration: MAX_SECONDS,
      });
      if (video) setResult({ kind: "video", video });
    } catch (error) {
      setFailure(error as CameraError);
    } finally {
      setRecording(false);
    }
  };

  if (unsupported) {
    return (
      <EmptyState
        icon="camera-off-outline"
        title="No camera here"
        description="This platform has no camera API."
      />
    );
  }

  if (!granted) {
    return (
      <EmptyState
        icon="camera-outline"
        title="Camera access"
        description="The preview starts once the camera is allowed."
        action={{
          label: "Allow the camera",
          iconName: "shield-check-outline",
          onPress: () => void onAllow(),
        }}
      />
    );
  }

  return (
    <View style={styles.recipe}>
      <Paper elevation={1} style={styles.stage}>
        <CameraView
          ref={camera}
          style={styles.preview}
          active={active}
          facing={facing}
          flash={flash}
          mode={mode === "video" ? "video" : "picture"}
          onBarcodeScanned={mode === "scan" ? onScanned : undefined}
          onReady={() => setReady(true)}
          onError={setFailure}
        >
          <View style={styles.overlay} pointerEvents="box-none">
            <HStack justify="space-between" align="center">
              {recording ? (
                <StatusBadge
                  label={`REC ${elapsed}s / ${MAX_SECONDS}s`}
                  type="error"
                />
              ) : (
                <View />
              )}
              <HStack spacing="s">
                <IconButton
                  icon={FLASH_ICON[flash]}
                  variant="tonal"
                  accessibilityLabel={`Flash: ${flash}`}
                  disabled={mode === "scan" || recording}
                  onClick={() => setFlash(NEXT_FLASH[flash])}
                />
                <IconButton
                  icon="camera-flip-outline"
                  variant="tonal"
                  accessibilityLabel="Switch camera"
                  disabled={recording}
                  onClick={() =>
                    setFacing(facing === "back" ? "front" : "back")
                  }
                />
              </HStack>
            </HStack>

            <HStack justify="center">
              {mode === "scan" ? (
                <Paper elevation={2} style={styles.hint}>
                  <Typography variant="labelLarge">
                    Point at a QR code
                  </Typography>
                </Paper>
              ) : mode === "photo" ? (
                <IconButton
                  icon="camera-iris"
                  variant="filled"
                  size="large"
                  accessibilityLabel="Take a photo"
                  disabled={!ready}
                  loading={busy}
                  onClick={takePicture}
                />
              ) : (
                <IconButton
                  icon={recording ? "stop" : "record-rec"}
                  variant="filled"
                  size="large"
                  selected={recording}
                  accessibilityLabel={
                    recording ? "Stop recording" : "Start recording"
                  }
                  disabled={!ready}
                  // Resolves only when the recording ends: don't hand the
                  // press a promise to wait on.
                  onClick={() => void toggleRecording()}
                />
              )}
            </HStack>
          </View>
        </CameraView>
      </Paper>

      {failure ? (
        <Typography variant="bodyMedium" style={{ color: theme.colors.error }}>
          {`${failure.code}: ${failure.message}`}
        </Typography>
      ) : null}

      <ResultView result={result} />
    </View>
  );
};

const ResultView = ({ result }: { result: Result | null }) => {
  if (!result) {
    return (
      <EmptyState
        icon="image-outline"
        title="Nothing captured yet"
        description="Scanned codes, photos and videos show up here."
      />
    );
  }
  if (result.kind === "code") {
    return (
      <ListSection>
        <ListItem secondary={result.barcode.data}>
          {`Scanned ${result.barcode.type} at ${new Date(result.at).toLocaleTimeString()}`}
        </ListItem>
      </ListSection>
    );
  }
  if (result.kind === "picture") {
    const { picture } = result;
    return (
      <View>
        <Image
          source={{ uri: picture.uri }}
          alt="The photo just taken"
          ratio={picture.width / picture.height}
          radius="large"
        />
        <ListSection>
          <ListItem secondary={`${picture.width} × ${picture.height}`}>
            Photo
          </ListItem>
        </ListSection>
      </View>
    );
  }
  return (
    <ListSection>
      <ListItem secondary={result.video.uri}>
        Video saved to the cache directory
      </ListItem>
    </ListSection>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    recipe: { gap: theme.spacing.m, width: "100%", maxWidth: 480 },
    stage: {
      overflow: "hidden",
      borderRadius: theme.shape.large,
      aspectRatio: 3 / 4,
    },
    preview: { flex: 1 },
    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: "space-between",
      padding: theme.spacing.m,
    },
    hint: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.shape.extraLarge,
    },
  });
