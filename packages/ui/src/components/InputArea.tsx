import React, {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Platform,
  TextInput,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { useDensity, type Density } from "../providers/Density";
import type { InputTextInputProps } from "./Input";
import type { MaterialCommunityIconsGlyphs } from "./types";
import FieldShell, { fieldText } from "./internal/FieldShell";
import { a11yState } from "./internal/a11yState";

export interface InputAreaProps {
  label?: string;
  placeholder?: string;
  value: string;
  maxLength?: number;
  /** Called with the new text on every edit. */
  onChange: (text: string) => void;
  /**
   * Visible lines of a field of fixed height: it is exactly that tall and its
   * text scrolls inside. Wins over `minRows` and `maxRows`. With none of the
   * three given the field is 4 lines.
   */
  rows?: number;
  /**
   * Without `rows`: the field starts this many lines tall and grows with its
   * text (up to `maxRows`, if given). Defaults to 1 when only `maxRows` is
   * given.
   */
  minRows?: number;
  /**
   * Without `rows`: the most lines the field grows to; past that its text
   * scrolls. Without it a field with `minRows` grows without limit. A value
   * under `minRows` is raised to it.
   */
  maxRows?: number;
  /**
   * The look of the box: `"outlined"` is a bordered box on the surface,
   * `"filled"` a tinted box that shows its border only while focused or in
   * error. Defaults to `"outlined"`.
   */
  variant?: "outlined" | "filled";
  /**
   * Where the label is drawn: `"outside"` above the box, or `"inside"`, small,
   * above the text within it. Independent of `variant`. Defaults to `"outside"`.
   */
  labelPlacement?: "inside" | "outside";
  /**
   * Stretches the field to its container's width. `false` shrinks it to its
   * content, with a minimum width. Defaults to `true`.
   */
  fullWidth?: boolean;
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /**
   * Keeps the line under the field even with no helper or error text, so a
   * message appearing does not push the next field down. Default false.
   */
  reserveHelperText?: boolean;
  /** Marks the label with an asterisk. */
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  /** Called when the field gains focus. */
  onFocus?: () => void;
  /** Called when the field loses focus. */
  onBlur?: () => void;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  trailingIcon?: MaterialCommunityIconsGlyphs;
  /** Pressing `trailingIcon`. It is a bare, unlabelled icon. */
  onTrailingIconPress?: () => void;
  /** Hints, focus and key handling for the underlying `TextInput`, as `Input`'s `inputProps`. */
  inputProps?: InputTextInputProps;
  /** A ref to the underlying `TextInput`, to focus it or select its text. */
  inputRef?: React.Ref<TextInput>;
  /** Control density: `"dense"` is 14 px text and less padding, for desktop forms. */
  density?: Density;
  style?: StyleProp<ViewStyle>;
}

/** The slice of a DOM `<textarea>` the web measurement touches. */
type TextareaNode = {
  scrollHeight: number;
  style: { height: string; overflow: string };
};

/**
 * A multi-line text field: `Input`'s box and props, for text that wraps over
 * several lines. `rows` gives it a fixed height; `minRows` and `maxRows` let it
 * grow with its text.
 *
 * ```tsx
 * <InputArea label="Message" rows={4} value={text} onChange={setText} />
 * <InputArea label="Comment" minRows={2} maxRows={8} value={text} onChange={setText} />
 * ```
 */
const InputArea = ({
  label,
  placeholder,
  value,
  maxLength,
  onChange,
  rows,
  minRows,
  maxRows,
  variant = "outlined",
  labelPlacement,
  fullWidth = true,
  error,
  helperText,
  reserveHelperText = false,
  required,
  disabled,
  readonly,
  onFocus,
  onBlur,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  inputProps,
  inputRef,
  density,
  style,
}: InputAreaProps) => {
  const { theme } = useTheme();
  const dense = useDensity(density) === "dense";
  const { paddingVertical, lineHeight } = fieldText(
    theme,
    dense,
    labelPlacement === "inside",
  );
  const isWeb = Platform.OS === "web";

  // `rows` wins; with no `minRows` / `maxRows` either the field is 4 lines.
  const fixed =
    rows !== undefined || (minRows === undefined && maxRows === undefined);
  const lines = Math.max(1, Math.round(rows ?? 4));
  const min = Math.max(1, Math.round(minRows ?? 1));
  const max = Math.max(min, Math.round(maxRows ?? Infinity));

  // The height of the text itself, without the padding, as last measured.
  const [content, setContent] = useState(0);
  const [width, setWidth] = useState(0);
  const node = useRef<TextInput | null>(null);
  useImperativeHandle(inputRef, () => node.current as TextInput, []);

  // Web: a textarea reports no content height smaller than its own (its
  // `scrollHeight` never drops under its box), so it could grow but never
  // shrink. Collapse it for a moment, read the content, put it back: all
  // before the browser paints. `width` re-measures when the text rewraps.
  useLayoutEffect(() => {
    const el = node.current as unknown as TextareaNode | null;
    if (!isWeb || fixed || !el?.style) return;
    const { height, overflow } = el.style;
    el.style.height = "0px";
    el.style.overflow = "hidden";
    const total = el.scrollHeight;
    el.style.height = height;
    el.style.overflow = overflow;
    setContent(Math.max(0, total - 2 * paddingVertical));
  }, [isWeb, fixed, value, width, paddingVertical, lineHeight]);

  const height =
    (fixed
      ? lines * lineHeight
      : Math.min(Math.max(content, min * lineHeight), max * lineHeight)) +
    2 * paddingVertical;

  return (
    <FieldShell
      multiline
      label={label}
      labelPlacement={labelPlacement}
      variant={variant}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      reserveHelperText={reserveHelperText}
      fullWidth={fullWidth}
      density={density}
      style={style}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      onTrailingIconPress={onTrailingIconPress}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {(field) => (
        <TextInput
          accessibilityLabel={label}
          {...a11yState("textbox", { disabled })}
          {...field.labelledBy}
          accessibilityHint={placeholder}
          multiline
          numberOfLines={fixed ? lines : undefined}
          readOnly={readonly}
          maxLength={maxLength}
          style={[field.style, { height, textAlignVertical: "top" }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={value}
          onChangeText={onChange}
          // Native reports the size of the text, shrinking included.
          onContentSizeChange={
            fixed || isWeb
              ? undefined
              : (e) => setContent(e.nativeEvent.contentSize.height)
          }
          onLayout={
            fixed || !isWeb
              ? undefined
              : (e) => setWidth(e.nativeEvent.layout.width)
          }
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          editable={!disabled}
          ref={node}
          {...inputProps}
        />
      )}
    </FieldShell>
  );
};

export default InputArea;
