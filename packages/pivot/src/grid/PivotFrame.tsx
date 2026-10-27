// The toolbar of a pivot (`toolbar` on PivotGrid), the same on web and phone: Export to Excel, Fullscreen
// and Reset, at the right as in the CRM's AuraPivot table. The export reads the grid's model at the
// tap, so the file holds what is on screen (the groups the person left open). Fullscreen shows the same
// engine in the library's full-screen dialog; Reset puts back the layout the engine had when the grid
// first appeared (groups and sorting), not its data.
import React, { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Dialog, IconButton, useTheme } from "@its/glowup-ui";
import type PivotEngine from "../core/PivotEngine";
import { saveXlsx } from "../export/save";
import usePivotMatrix from "../hooks/usePivotMatrix";
import { gridToXlsx, xlsxName } from "../export/xlsx";
import type { LocalizationDictionary } from "../localization/types";
import { DEFAULT_HEIGHT } from "./layout";
import { buildGridModel } from "./model";
import type { PivotGridProps } from "./props";

const TOOLBAR_HEIGHT = 48;
// ponytail: the full-screen dialog's header (56 px) plus room for the system bars, guessed; the grid
// scrolls inside the dialog if the guess is short. Read the safe-area insets if it shows.
const DIALOG_CHROME = 120;

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

  const exportXlsx = async () => {
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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setError(null);
    if (initial?.engine === engine) engine.setReport(initial.report);
  };

  const frame = (inDialog: boolean, total: number) => (
    <View>
      <View style={styles.bar}>
        <IconButton
          icon="microsoft-excel"
          accessibilityLabel={caption(
            localization,
            "toolbar",
            "exportExcel",
            "Export to Excel",
          )}
          onClick={exportXlsx}
          loading={busy}
        />
        <IconButton
          icon={inDialog ? "fullscreen-exit" : "fullscreen"}
          accessibilityLabel={
            inDialog
              ? caption(
                  localization,
                  "toolbar",
                  "exitFullscreen",
                  "Exit Fullscreen",
                )
              : caption(localization, "toolbar", "fullscreen", "Fullscreen")
          }
          onClick={() => setOpen(!inDialog)}
        />
        <IconButton
          icon="restore"
          accessibilityLabel={caption(
            localization,
            "buttons",
            "reset",
            "Reset",
          )}
          onClick={reset}
        />
      </View>
      {error ? (
        <Text
          testID="pivot-export-error"
          style={[
            theme.typography.bodyMedium,
            styles.error,
            { color: theme.colors.error },
          ]}
        >
          {error}
        </Text>
      ) : null}
      <Grid
        engine={engine}
        localization={localization}
        height={total - TOOLBAR_HEIGHT}
      />
    </View>
  );

  return (
    <>
      {frame(false, height)}
      <Dialog
        fullScreen
        visible={open}
        onClose={() => setOpen(false)}
        closeIcon={false}
        testID="pivot-fullscreen"
      >
        {frame(true, Math.max(320, window.height - DIALOG_CHROME))}
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
  error: { paddingHorizontal: 8, paddingBottom: 8 },
});

export default PivotFrame;
