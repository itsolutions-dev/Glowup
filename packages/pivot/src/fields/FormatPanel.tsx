// The number format of the values, behind the toolbar's Format button: the "Number format" part of
// AuraPivot's format dialog rebuilt on the library (decimals, separators, currency, the text of an
// empty cell, percentages). Apply writes it with `setFormat({ values })`, which emits `formatChange`
// and reaches `getReport()`, so a saved configuration keeps it. Cell styles and conditional rules
// are not offered.
import React, { useState } from "react";
import { View } from "react-native";
import { Button, Checkbox, Dialog, Input, Select } from "@its/glowup-ui";
import type PivotEngine from "../core/PivotEngine";
import type { CellStyleFormat } from "../core/PivotEngine";
import type { LocalizationDictionary } from "../localization/types";
import { caption } from "../grid/caption";

export interface FormatPanelProps {
  engine: PivotEngine;
  localization?: LocalizationDictionary;
  visible: boolean;
  onClose: () => void;
}

/** The values `formatNumberWithFormat` reads, with what it assumes when one is missing. */
const DEFAULTS = {
  numberOfDecimals: "Default",
  thousandSeparator: "System",
  decimalSeparator: "System",
  currencySymbol: "None",
  currencyAlignment: "Left",
  nullValue: "",
  percentage: false,
};

const FormatPanel = (props: FormatPanelProps) =>
  props.visible ? <FormatPanelBody {...props} /> : null;

const FormatPanelBody = ({
  engine,
  localization,
  onClose,
}: FormatPanelProps) => {
  const t = (key: string, fallback: string) =>
    caption(localization, "formatDialog", key, fallback);
  const tb = (key: string, fallback: string) =>
    caption(localization, "buttons", key, fallback);
  const [draft, setDraft] = useState<CellStyleFormat>(() => ({
    ...DEFAULTS,
    ...engine.getFormat().values,
  }));
  const set = (key: keyof typeof DEFAULTS) => (value: unknown) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const system = t("system", "System");
  const none = t("none", "None");
  const options = (pairs: [string, string][]) =>
    pairs.map(([value, label]) => ({ value, label }));

  const apply = () => {
    engine.setFormat({ values: draft });
    onClose();
  };

  return (
    <Dialog
      visible
      onClose={onClose}
      title={caption(localization, "toolbar", "format", "Format")}
      overline={t("numberFormat", "Number format")}
      width="sm"
      scrollable
      testID="pivot-format"
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {tb("cancel", "Cancel")}
          </Button>
          <Button onClick={apply} testID="pivot-format-apply">
            {tb("apply", "Apply")}
          </Button>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <Select
          label={t("decimals", "Decimals")}
          value={String(draft.numberOfDecimals)}
          onChange={set("numberOfDecimals")}
          options={options([
            ["Default", t("default", "Default")],
            ...Array.from(
              { length: 7 },
              (_, n) => [String(n), String(n)] as [string, string],
            ),
          ])}
        />
        <Select
          label={t("thousandSeparator", "Thousands separator")}
          value={draft.thousandSeparator}
          onChange={set("thousandSeparator")}
          options={options([
            ["System", system],
            ["None", none],
            [".", "."],
            [",", ","],
            [" ", "␣"],
          ])}
        />
        <Select
          label={t("decimalSeparator", "Decimal separator")}
          value={draft.decimalSeparator}
          onChange={set("decimalSeparator")}
          options={options([
            ["System", system],
            [".", "."],
            [",", ","],
          ])}
        />
        <Select
          label={t("currencySymbol", "Currency symbol")}
          value={draft.currencySymbol}
          onChange={set("currencySymbol")}
          options={options([
            ["None", none],
            ["System", system],
            ["€", "€"],
            ["$", "$"],
            ["£", "£"],
          ])}
        />
        <Select
          label={t("currencyAlignment", "Currency alignment")}
          value={draft.currencyAlignment}
          onChange={set("currencyAlignment")}
          disabled={draft.currencySymbol === "None"}
          options={options([
            ["Left", t("left", "Left")],
            ["Right", t("right", "Right")],
          ])}
        />
        <Input
          label={t("nullValue", "Null value")}
          value={String(draft.nullValue ?? "")}
          onChange={set("nullValue")}
        />
        <Checkbox
          label={t("percentage", "Format as percentage")}
          checked={!!draft.percentage}
          onValueChange={set("percentage")}
        />
      </View>
    </Dialog>
  );
};

export default FormatPanel;
