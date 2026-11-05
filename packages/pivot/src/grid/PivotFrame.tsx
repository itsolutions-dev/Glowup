// The toolbar of a pivot (`toolbar` on PivotGrid), the same on web and phone: Export to Excel, Fullscreen
// and Reset, at the right as in the CRM's AuraPivot table. The export reads the grid's model at the
// tap, so the file holds what is on screen (the groups the person left open). Fullscreen shows the same
// engine in the library's full-screen dialog; Reset puts back the layout the engine had when the grid
// first appeared (groups and sorting), not its data.
import React, { useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Dialog, IconButton, useTheme } from "@its/glowup-ui";
import type PivotEngine from "../core/PivotEngine";
import { PivotExportError } from "../export/errors";
import { saveXlsx } from "../export/save";
import usePivotMatrix from "../hooks/usePivotMatrix";
import { gridToXlsx, xlsxName } from "../export/xlsx";
import type { LocalizationDictionary } from "../localization/types";
import { DEFAULT_HEIGHT } from "./layout";
import { buildGridModel } from "./model";
import type { PivotGridProps } from "./props";

const TOOLBAR_HEIGHT = 48;
// The full-screen dialog's header (56 px, which holds the buttons) and the bottom padding of its body.
const DIALOG_HEADER = 56;
// ponytail: the status and navigation bars on a phone, guessed (the package cannot read the safe-area
// insets without depending on react-native-safe-area-context); the grid scrolls inside the dialog if the
// guess is short. The web has no bars.
const SYSTEM_BARS = Platform.OS === "web" ? 0 : 100;

// What a person reads when an export fails; the cause itself goes to the developer's console.
const EXPORT_ERRORS = {
  "native-missing": [
    "exportUnavailable",
    "Export to Excel is not available in this app.",
  ],
  unsupported: ["exportNoSharing", "This device cannot share files."],
  other: ["exportFailed", "The export did not work. Try again."],
} as const;

const caption = (
  localization: LocalizationDictionary | undefined,
  section: string,
  key: string,
  fallback: string,
) => {
  const value = (
    localization?.[section] as Record<string, unknown> | undefined
  )?.[key];
  return typeof value === "string" && value ? value : fallback;
};

// The three buttons; each one's name is also its tooltip (hover on the web, a long press on a phone).
const Buttons = ({
  inDialog,
  localization,
  busy,
  onExport,
  onFullscreen,
  onReset,
}: {
  inDialog: boolean;
  localization: LocalizationDictionary | undefined;
  busy: boolean;
  onExport: () => void;
  onFullscreen: () => void;
  onReset: () => void;
}) => {
  const exportLabel = caption(
    localization,
    "toolbar",
    "exportExcel",
    "Export to Excel",
  );
  const fullscreenLabel = inDialog
    ? caption(localization, "toolbar", "exitFullscreen", "Exit Fullscreen")
    : caption(localization, "toolbar", "fullscreen", "Fullscreen");
  const resetLabel = caption(localization, "buttons", "reset", "Reset");
  return (
    <View style={styles.buttons}>
      <IconButton
        icon="microsoft-excel"
        accessibilityLabel={exportLabel}
        title={exportLabel}
        onClick={onExport}
        loading={busy}
      />
      <IconButton
        icon={inDialog ? "fullscreen-exit" : "fullscreen"}
        accessibilityLabel={fullscreenLabel}
        title={fullscreenLabel}
        onClick={onFullscreen}
      />
      <IconButton
        icon="restore"
        accessibilityLabel={resetLabel}
        title={resetLabel}
        onClick={onReset}
      />
    </View>
  );
};

type PivotFrameProps = Omit<PivotGridProps, "toolbar"> & {
  Grid: React.ComponentType<PivotGridProps>;
};

const PivotFrame = ({
  Grid,
  engine,
  localization,
  height = DEFAULT_HEIGHT,
  fileName,
}: PivotFrameProps) => {
  const { theme } = useTheme();
  const window = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The layout to reset to is taken the first time this engine has rows to show, not at mount: an app
  // often mounts the grid on an empty engine and sets the data and the report after a fetch. The data
  // is left out: a reset puts back the layout, never rows the app has replaced since.
  const { matrix } = usePivotMatrix(engine);
  const [initial, setInitial] = useState<{
    engine: PivotEngine;
    report: unknown;
  } | null>(null);
  if ((matrix?.sourceRows?.length ?? 0) > 0 && initial?.engine !== engine) {
    setInitial({
      engine,
      report: { ...engine.getReport(), dataSource: undefined },
    });
  }

  // Two taps in the same frame both see `busy` still false: the ref stops the second one.
  const exporting = useRef(false);
  const exportXlsx = async () => {
    if (exporting.current) return;
    exporting.current = true;
    setError(null);
    setBusy(true);
    try {
      const model = buildGridModel({
        matrix: engine.processMatrix(),
        slice: engine.getSlice(),
        format: engine.getFormat(),
        metadata: engine.getMetadata(),
        locale: engine.getLocale(),
        localization,
      });
      await saveXlsx(gridToXlsx(model), xlsxName(fileName));
    } catch (e) {
      if (__DEV__) console.warn(e);
      const [key, fallback] =
        EXPORT_ERRORS[e instanceof PivotExportError ? e.code : "other"];
      const message = caption(localization, "toolbar", key, fallback);
      setError(message);
      // iOS has no live regions: say it.
      if (Platform.OS === "ios")
        AccessibilityInfo.announceForAccessibility(message);
    } finally {
      exporting.current = false;
      setBusy(false);
    }
  };

  const reset = () => {
    setError(null);
    if (initial?.engine === engine) engine.setReport(initial.report);
  };

  const buttons = (inDialog: boolean) => (
    <Buttons
      inDialog={inDialog}
      localization={localization}
      busy={busy}
      onExport={exportXlsx}
      onFullscreen={() => setOpen(!inDialog)}
      onReset={reset}
    />
  );

  // The message takes the room beside the buttons, two lines at most, so the grid keeps its height.
  const errorText = error ? (
    <Text
      testID="pivot-export-error"
      role="alert"
      accessibilityLiveRegion="polite"
      numberOfLines={2}
      style={[
        theme.typography.bodySmall,
        styles.error,
        { color: theme.colors.error },
      ]}
    >
      {error}
    </Text>
  ) : null;

  return (
    <>
      <View>
        <View style={styles.bar}>
          {errorText}
          {buttons(false)}
        </View>
        <Grid
          engine={engine}
          localization={localization}
          height={height - TOOLBAR_HEIGHT}
        />
      </View>
      <Dialog
        fullScreen
        visible={open}
        onClose={() => setOpen(false)}
        closeIcon={false}
        actions={buttons(true)}
        testID="pivot-fullscreen"
      >
        {errorText}
        <Grid
          engine={engine}
          localization={localization}
          height={Math.max(
            320,
            window.height - DIALOG_HEADER - theme.spacing.l - SYSTEM_BARS,
          )}
        />
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  buttons: { flexDirection: "row", alignItems: "center", gap: 4 },
  error: { flex: 1, paddingHorizontal: 8 },
});

export default PivotFrame;
