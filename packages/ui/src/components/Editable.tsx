import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { useTheme, getGlowStyles, Theme } from "../providers/ThemeProvider";
import Glyph from "./Glyph";
import IconButton from "./IconButton";
import Input from "./Input";
import Select, { type Option } from "./Select";
import Typography, { type TypographyProps } from "./Typography";
import { useEscapeKey } from "./internal/useEscapeKey";
import type { PressableState } from "./types";

/** What an `Editable` edits with: a text field, a multi-line one, a number field or a dropdown. */
export type EditableType = "text" | "textarea" | "number" | "select";

const SIZES = {
  small: { text: "bodyMedium", icon: 16, dense: true, min: 32 },
  medium: { text: "bodyLarge", icon: 18, dense: false, min: 40 },
  large: { text: "titleLarge", icon: 22, dense: false, min: 48 },
} as const;

export interface EditableProps {
  /** The value, as text (for `type="number"` too: `"12.50"`, as `Input` has it). Controlled; pair with `onChange`. */
  value?: string;
  /** The value to start from when uncontrolled. Defaults to `""`. */
  defaultValue?: string;
  /**
   * Called with the text on every edit while the field is open. When the edit
   * is cancelled it is called once more with the value the edit started from.
   */
  onChange?: (value: string) => void;
  /** Called with the value when the edit is confirmed (Enter, blur or the check button, per `submitMode`). */
  onSubmit?: (value: string) => void;
  /** Called with the value the edit started from when it is cancelled (Escape or the close button). */
  onCancel?: (previous: string) => void;
  /**
   * The field that opens: `"text"` is an `Input`, `"textarea"` a multi-line
   * `Input` (Enter adds a line; Ctrl or Cmd + Enter confirms), `"number"` an
   * `Input type="number"` (the value stays plain text) and `"select"` a
   * `Select` that is already open, which confirms on the pick. Defaults to
   * `"text"`.
   */
  type?: EditableType;
  /** The choices of a `type="select"`. The display shows the label of the selected one. */
  options?: Option[];
  /**
   * What confirms the edit: `"blur"` (focus leaving the field), `"enter"`
   * (Enter), `"both"`, or `"none"`, which shows check and close buttons to
   * confirm and cancel with. Escape cancels in every mode. Defaults to
   * `"both"`.
   */
  submitMode?: "blur" | "enter" | "both" | "none";
  /**
   * Shows the check and close buttons whatever the `submitMode`. With them
   * shown, leaving the field no longer confirms it. Defaults to `false`.
   */
  showControls?: boolean;
  /** Drawn in the muted tone when the value is empty. Defaults to `"Edit"`. */
  placeholder?: string;
  /**
   * Checks the value: return the message to show as the field's error, or
   * `undefined` when it is fine. While there is an error the edit cannot be
   * confirmed.
   */
  validate?: (value: string) => string | undefined;
  /** Selects the whole text when the field opens, to type over it. Defaults to `false`. */
  selectAllOnFocus?: boolean;
  /** Mounts with the field already open (uncontrolled). Defaults to `false`. */
  startWithEditView?: boolean;
  /** Controls whether the field is open; pair with `onEditingChange`. */
  editing?: boolean;
  /** Called with the new state when the edit starts, is confirmed or is cancelled. */
  onEditingChange?: (editing: boolean) => void;
  /** Dims the text and keeps it from opening. */
  disabled?: boolean;
  /** Shows the text as plain text, with no way to open it. */
  readOnly?: boolean;
  /** The look of the open field: `"outlined"` or `"filled"`, as in `Input`. Defaults to `"outlined"`. */
  variant?: "outlined" | "filled";
  /** The size of the text, the pencil and the open field (`"small"` is dense). Defaults to `"medium"`. */
  size?: "small" | "medium" | "large";
  /** The type-scale role of the displayed text, over what `size` picks. */
  textVariant?: TypographyProps["variant"];
  /** Draws the displayed value your way (a link, a badge, a formatted amount) instead of as text. */
  renderDisplay?: (value: string) => React.ReactNode;
  /** The accessible name of the display button and of the open field. Not drawn. */
  label?: string;
  /** For `type="number"`: the decimals the field keeps. */
  precision?: number;
  /** Root testID. The open field gets `${testID}-input`, the buttons `${testID}-save` and `${testID}-cancel`. */
  testID?: string;
}

/**
 * Text that edits in place: it reads as text, and when you click, tap or press
 * Enter on it, it turns into a field. Enter or leaving the field keeps the
 * change, Escape drops it.
 *
 * ```tsx
 * <Editable value={name} onChange={setName} onSubmit={save} label="Name" />
 * <Editable type="select" options={roles} value={role} onChange={setRole} />
 * ```
 */
const Editable = ({
  value: valueProp,
  defaultValue = "",
  onChange,
  onSubmit,
  onCancel,
  type = "text",
  options,
  submitMode = "both",
  showControls = false,
  placeholder = "Edit",
  validate,
  selectAllOnFocus = false,
  startWithEditView = false,
  editing: editingProp,
  onEditingChange,
  disabled = false,
  readOnly = false,
  variant = "outlined",
  size = "medium",
  textVariant,
  renderDisplay,
  label,
  precision,
  testID,
}: EditableProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const sizing = SIZES[size];
  const displayRef = useRef<View>(null);

  const [valueState, setValueState] = useState(defaultValue);
  const value = valueProp ?? valueState;
  const [editingState, setEditingState] = useState(startWithEditView);
  const isEditing = !disabled && !readOnly && (editingProp ?? editingState);

  // What the open field started from, and whether it has been touched since:
  // an error is not shown over a value nobody has changed yet.
  const [session, setSession] = useState<{
    from: string;
    touched: boolean;
  } | null>(null);
  if (isEditing && !session) setSession({ from: value, touched: false });
  else if (!isEditing && session) setSession(null);

  // Set while an edit is being confirmed or dropped, so a second signal for the
  // same end (Enter, then the blur it causes) does not count twice.
  const closing = useRef(false);
  const restoreFocus = useRef(false);
  const close = (byKeyboard: boolean) => {
    closing.current = true;
    queueMicrotask(() => {
      closing.current = false;
    });
    restoreFocus.current = byKeyboard;
  };
  useEffect(() => {
    if (!isEditing && restoreFocus.current) {
      restoreFocus.current = false;
      if (Platform.OS === "web") {
        (displayRef.current as unknown as HTMLElement | null)?.focus?.();
      }
    }
  }, [isEditing]);

  const setEditing = useCallback(
    (next: boolean) => {
      if (editingProp === undefined) setEditingState(next);
      onEditingChange?.(next);
    },
    [editingProp, onEditingChange],
  );

  const change = (next: string) => {
    if (valueProp === undefined) setValueState(next);
    onChange?.(next);
    setSession((s) => s && { ...s, touched: true });
  };

  const error = session?.touched ? validate?.(value) : undefined;

  const commit = (next: string = value, byKeyboard = false) => {
    if (closing.current) return;
    if (validate?.(next)) {
      setSession((s) => s && { ...s, touched: true });
      return;
    }
    close(byKeyboard);
    onSubmit?.(next);
    setEditing(false);
  };

  const cancel = (byKeyboard = false) => {
    if (closing.current) return;
    close(byKeyboard);
    const from = session?.from ?? value;
    if (value !== from) {
      if (valueProp === undefined) setValueState(from);
      onChange?.(from);
    }
    onCancel?.(from);
    setEditing(false);
  };

  const controls = showControls || submitMode === "none";
  const enterSubmits = submitMode === "enter" || submitMode === "both";
  const blurSubmits =
    !controls && (submitMode === "blur" || submitMode === "both");

  // A dropdown has no key handler of its own to cancel from.
  useEscapeKey(isEditing && type === "select", () => cancel(true));

  const onKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    const { key, ctrlKey, metaKey } = event.nativeEvent as unknown as {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
    };
    if (key === "Escape") {
      // Not also the Escape of the dialog this may sit in.
      event.stopPropagation?.();
      cancel(true);
    } else if (
      key === "Enter" &&
      type === "textarea" &&
      enterSubmits &&
      (ctrlKey || metaKey)
    ) {
      commit(value, true);
    }
  };

  const selected = options?.find((o) => String(o.value) === value);
  const text = selected?.label ?? value;

  if (!isEditing) {
    const shown = text ? (
      <Typography variant={textVariant ?? sizing.text}>{text}</Typography>
    ) : (
      <Typography variant={textVariant ?? sizing.text} color="onSurfaceVariant">
        {placeholder}
      </Typography>
    );
    const content = renderDisplay ? renderDisplay(value) : shown;

    if (readOnly) {
      return (
        <View
          testID={testID}
          style={[styles.display, { minHeight: sizing.min }]}
        >
          {content}
        </View>
      );
    }
    return (
      <Pressable
        ref={displayRef}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label ? `${label}: ` : ""}${text || placeholder}`}
        accessibilityHint="Edit"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setEditing(true)}
        style={({ hovered, focused }: PressableState) => [
          styles.display,
          styles.interactive,
          { minHeight: sizing.min },
          (hovered || focused) && {
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
          focused && getGlowStyles(theme, true),
          disabled && styles.disabled,
        ]}
      >
        {({ hovered, focused }: PressableState) => (
          <>
            {content}
            {/* Space kept either way, so the text does not shift. No hover on
                a touch screen: there the pencil is always drawn. */}
            <View
              style={{
                opacity: Platform.OS !== "web" || hovered || focused ? 1 : 0,
              }}
            >
              <Glyph
                name="pencil-outline"
                size={sizing.icon}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </>
        )}
      </Pressable>
    );
  }

  const field =
    type === "select" ? (
      <Select
        options={options ?? []}
        value={selected?.value ?? null}
        onChange={(next) => {
          const picked = String(next ?? "");
          change(picked);
          if (!controls) commit(picked, true);
        }}
        label={label}
        error={error}
        variant={variant}
        density={sizing.dense ? "dense" : "normal"}
        style={styles.fieldNoGap}
        defaultOpen
      />
    ) : (
      <Input
        value={value}
        onChange={change}
        type={type === "number" ? "number" : "text"}
        precision={precision}
        multiline={type === "textarea"}
        rows={3}
        variant={variant}
        density={sizing.dense ? "dense" : "normal"}
        error={error}
        style={styles.fieldNoGap}
        onBlur={blurSubmits ? () => commit() : undefined}
        inputProps={{
          autoFocus: true,
          selectTextOnFocus: selectAllOnFocus,
          accessibilityLabel: label,
          testID: testID ? `${testID}-input` : undefined,
          onKeyPress,
          onSubmitEditing:
            type !== "textarea" && enterSubmits
              ? () => commit(value, true)
              : undefined,
        }}
      />
    );

  return (
    <View style={styles.row}>
      <View style={styles.field}>{field}</View>
      {controls && (
        <View style={[styles.controls, { height: sizing.dense ? 40 : 56 }]}>
          <IconButton
            icon="check"
            color="primary"
            size={sizing.dense ? "small" : "medium"}
            accessibilityLabel="Save"
            onClick={() => commit(value, true)}
            testID={testID ? `${testID}-save` : undefined}
          />
          <IconButton
            icon="close"
            size={sizing.dense ? "small" : "medium"}
            accessibilityLabel="Cancel"
            onClick={() => cancel(true)}
            testID={testID ? `${testID}-cancel` : undefined}
          />
        </View>
      )}
    </View>
  );
};

export default Editable;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    display: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: theme.spacing.s,
      borderRadius: theme.shape.small,
      paddingHorizontal: theme.spacing.s,
    },
    interactive: {
      ...Platform.select({ web: { cursor: "pointer" } }),
    },
    disabled: { opacity: 0.38 },
    row: { flexDirection: "row", alignItems: "flex-start" },
    field: { flex: 1 },
    // The open field takes the room of the text it replaced, no more.
    fieldNoGap: { marginBottom: 0 },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      marginStart: theme.spacing.xs,
    },
  });
