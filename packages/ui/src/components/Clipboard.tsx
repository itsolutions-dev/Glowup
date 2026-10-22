import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import IconButton, {
  type IconButtonSize,
  type IconButtonVariant,
} from "./IconButton";
import { type ColorRole } from "./internal/colorRole";

/**
 * Writes `text` to the clipboard. Resolve when it is written, throw (or reject)
 * when it could not be: the app wires `expo-clipboard`'s `setStringAsync` here
 * on native.
 */
export type ClipboardWriter = (text: string) => void | Promise<void>;

// The copy command on a hidden textarea: what a page without the async
// Clipboard API (an insecure origin, an old browser) has left. False when there
// is no document, or the browser refused.
const execCopy = (text: string): boolean => {
  if (typeof document === "undefined" || !document.body) return false;
  if (typeof document.execCommand !== "function") return false;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  Object.assign(area.style, {
    position: "fixed",
    top: "0",
    left: "0",
    opacity: "0",
    pointerEvents: "none",
  });
  const focused = document.activeElement as HTMLElement | null;
  document.body.appendChild(area);
  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    focused?.focus?.();
  }
};

// The web default. True when the text was written, false when the page has no
// way to write at all; throws when the browser refused.
const writeOnWeb = async (text: string): Promise<boolean> => {
  const api =
    typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  if (api?.writeText) {
    try {
      await api.writeText(text);
      return true;
    } catch (error) {
      // Refused (no permission, an unfocused page): the old command may still work.
      if (execCopy(text)) return true;
      throw error;
    }
  }
  return execCopy(text);
};

/**
 * Whether a copy can do anything: always on web, on native only when the app
 * says how (`copy`) or wants to be told (`onCopy`).
 */
export const isClipboardAvailable = (
  copy?: ClipboardWriter,
  onCopy?: (text: string) => void,
) => Platform.OS === "web" || !!copy || !!onCopy;

export interface UseClipboardOptions {
  /** How long `copied` stays true after a copy, in ms. Defaults to 1500. */
  timeout?: number;
  /**
   * Writes the text. On web it defaults to `navigator.clipboard.writeText`,
   * with the old `execCommand("copy")` where that is missing. The library has
   * no clipboard dependency, so on native there is no default: pass one
   * (`expo-clipboard`'s `setStringAsync`) or only `onCopy` is called.
   */
  copy?: ClipboardWriter;
  /** Called with the text after it was copied. */
  onCopy?: (text: string) => void;
  /** What a screen reader is told after a copy; `""` says nothing. Defaults to `"Copied"`. */
  announcement?: string;
}

export interface UseClipboardResult {
  /**
   * Copies the text. Resolves `true` once it is copied (or, with no way to
   * write, handed to `onCopy`), `false` when the write was refused or there was
   * nothing to copy with.
   */
  copy: (text: string) => Promise<boolean>;
  /** True for `timeout` ms after a copy: swap an icon, a label. */
  copied: boolean;
}

/**
 * Copying with a confirmation: `copy(text)` writes to the clipboard and turns
 * `copied` on for a moment.
 *
 * ```tsx
 * const { copy, copied } = useClipboard();
 * <Button onClick={() => copy(invite)}>{copied ? "Copied" : "Copy link"}</Button>
 * ```
 */
export const useClipboard = ({
  timeout = 1500,
  copy: write,
  onCopy,
  announcement = "Copied",
}: UseClipboardOptions = {}): UseClipboardResult => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      // With nothing to write with, `onCopy` is the app doing the copying.
      let handled = !!onCopy;
      try {
        if (write) {
          await write(text);
          handled = true;
        } else if (Platform.OS === "web") {
          handled = (await writeOnWeb(text)) || handled;
        }
      } catch {
        // Refused: nothing was copied, so nothing is reported.
        return false;
      }
      if (!handled) return false;
      onCopy?.(text);
      // Unmounted while the write was pending: copied, but nobody to confirm to.
      if (!mounted.current) return true;
      setCopied(true);
      if (announcement)
        AccessibilityInfo.announceForAccessibility(announcement);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
      return true;
    },
    [write, onCopy, announcement, timeout],
  );

  return { copy, copied };
};

export interface ClipboardProps {
  /** The text a press copies. */
  value: string;
  /** Called with `value` after it was copied. */
  onCopy?: (value: string) => void;
  /**
   * Writes the text. On web it defaults to `navigator.clipboard.writeText`
   * (with an `execCommand("copy")` fallback). On native there is no default:
   * pass one (`expo-clipboard`'s `setStringAsync`), or the trigger is drawn
   * only with an `onCopy` that does the copying, and nothing without either.
   */
  copy?: ClipboardWriter;
  /** How long the confirmation (the check, `copied`) shows, in ms. Defaults to 1500. */
  timeout?: number;
  /** Container style of the default `IconButton`. Defaults to `"standard"`. */
  variant?: IconButtonVariant;
  /** Colour role of the default `IconButton`. The confirmation is always `success`. */
  color?: ColorRole;
  /** Size of the default `IconButton`. Defaults to `"large"`, the 48 dp touch target; `"small"` suits a button beside a value. */
  size?: IconButtonSize;
  /** Accessible label of the trigger before the copy. Defaults to `"Copy"`. */
  label?: string;
  /** Accessible label of the trigger after the copy, also announced to screen readers. Defaults to `"Copied"`. */
  copiedLabel?: string;
  disabled?: boolean;
  /**
   * Draws your own trigger instead of the default icon button. A node is the
   * content of a pressable (a button inside it would nest buttons: draw the
   * trigger yourself for that); a function gets `{ copied, copy }`, `copy`
   * copying `value`, and is drawn as returned, the trigger being yours.
   */
  children?:
    | React.ReactNode
    | ((state: {
        copied: boolean;
        copy: () => Promise<boolean>;
      }) => React.ReactNode);
  /** Style of the trigger. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A copy trigger: an icon button that copies `value` and shows a check for a
 * moment. The library has no clipboard dependency, so on native the app passes
 * a `copy` writer; on web it works as is.
 *
 * ```tsx
 * <Clipboard value={apiKey} />
 * <Clipboard value={apiKey} copy={setStringAsync}>
 *   {({ copied, copy }) => <Button onClick={copy}>{copied ? "Copied" : "Copy key"}</Button>}
 * </Clipboard>
 * ```
 */
const Clipboard = ({
  value,
  onCopy,
  copy: write,
  timeout,
  variant = "standard",
  color,
  size = "large",
  label = "Copy",
  copiedLabel = "Copied",
  disabled,
  children,
  style,
  testID,
}: ClipboardProps) => {
  const { copy, copied } = useClipboard({
    timeout,
    copy: write,
    onCopy,
    announcement: copiedLabel,
  });
  if (!isClipboardAvailable(write, onCopy)) return null;

  const run = () => copy(value);

  if (typeof children === "function") {
    return <>{children({ copied, copy: run })}</>;
  }
  if (children != null && children !== false) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copied ? copiedLabel : label}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={() => void run()}
        style={style}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <IconButton
      icon={copied ? "check" : "content-copy"}
      variant={variant}
      color={copied ? "success" : color}
      size={size}
      accessibilityLabel={copied ? copiedLabel : label}
      disabled={disabled}
      onClick={() => void run()}
      style={style}
      testID={testID}
    />
  );
};

export default Clipboard;
