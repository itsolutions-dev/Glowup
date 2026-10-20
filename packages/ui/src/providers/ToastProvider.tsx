import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
import Snackbar, {
  type SnackbarPosition,
  type SnackbarSeverity,
  type SnackbarVariant,
} from "../components/Snackbar";
import { MaterialCommunityIconsGlyphs } from "../components/types";

export interface ToastOptions {
  message: string;
  /** Drives the colors and the default icon. Left out, the toast is the neutral inverse surface. */
  severity?: SnackbarSeverity;
  /** `"contained"` (the default) fills the toast; `"outlined"` draws it on the surface with an outline. */
  variant?: SnackbarVariant;
  /** Where it appears. Defaults to the provider's `position`. */
  position?: SnackbarPosition;
  /** Auto-hide delay in ms. Defaults to 4000. Not used when `onClose` is set. */
  duration?: number;
  /** Overrides the icon implied by `severity`. */
  icon?: MaterialCommunityIconsGlyphs;
  /** A text button after the message; clicking it runs `onClick` and dismisses the toast. */
  action?: { label: string; onClick: () => void };
  /**
   * Keeps the toast up until the user closes it, with a close button: the
   * `duration` is not used. Called after the toast has left the queue.
   */
  onClose?: () => void;
  /**
   * Replaces any queued toast carrying the same id instead of appending one.
   * Use it to keep a repeated event (a retry, a poll) from stacking up.
   */
  id?: string;
}

interface QueuedToast extends ToastOptions {
  key: string;
}

interface ToastApi {
  /** Enqueues a toast and returns its key. */
  show: (options: ToastOptions) => string;
  /** Shorthand for `show({ severity: "success" })`. */
  success: (
    message: string,
    options?: Omit<ToastOptions, "message" | "severity">,
  ) => string;
  /** Shorthand for `show({ severity: "error" })`. */
  error: (
    message: string,
    options?: Omit<ToastOptions, "message" | "severity">,
  ) => string;
  /** Shorthand for `show({ severity: "warning" })`. */
  warning: (
    message: string,
    options?: Omit<ToastOptions, "message" | "severity">,
  ) => string;
  /** Shorthand for `show({ severity: "info" })`. */
  info: (
    message: string,
    options?: Omit<ToastOptions, "message" | "severity">,
  ) => string;
  /** Dismisses one toast by key, or the whole queue when called bare. */
  hide: (key?: string) => void;
  /** Keys currently queued, head first. */
  queue: string[];
}

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Imperative toasts from anywhere in the tree — no `visible` state to thread
 * through the screen. Requires a `ToastProvider` above the caller.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
};

let counter = 0;
const nextKey = () => `toast-${++counter}`;

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Where toasts appear unless one asks for another. Defaults to `"bottom-center"`. */
  position?: SnackbarPosition;
}

/**
 * Renders one toast at a time from a FIFO queue, so a burst of events plays
 * back in order instead of overwriting itself.
 */
export const ToastProvider = ({
  children,
  position = "bottom-center",
}: ToastProviderProps) => {
  const [queue, setQueue] = useState<QueuedToast[]>([]);

  const show = useCallback((options: ToastOptions) => {
    const key = options.id ?? nextKey();
    setQueue((current) => {
      const withoutSameId = options.id
        ? current.filter((toast) => toast.key !== options.id)
        : current;
      return [...withoutSameId, { ...options, key }];
    });
    return key;
  }, []);

  const hide = useCallback((key?: string) => {
    setQueue((current) =>
      key === undefined ? [] : current.filter((toast) => toast.key !== key),
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, options) =>
        show({ ...options, message, severity: "success" }),
      error: (message, options) =>
        show({ ...options, message, severity: "error" }),
      warning: (message, options) =>
        show({ ...options, message, severity: "warning" }),
      info: (message, options) =>
        show({ ...options, message, severity: "info" }),
      hide,
      queue: queue.map((toast) => toast.key),
    }),
    [show, hide, queue],
  );

  const current = queue[0];

  return (
    <ToastContext.Provider value={api}>
      {children}
      {!!current && (
        // pointerEvents="box-none" keeps the rest of the screen tappable while
        // a toast is on screen; the toast itself still receives presses.
        <View style={styles.host} pointerEvents="box-none">
          <Snackbar
            // Remounting per toast restarts the enter animation and the timer.
            key={current.key}
            visible
            message={current.message}
            severity={current.severity}
            variant={current.variant}
            position={current.position ?? position}
            icon={current.icon}
            duration={current.duration}
            action={current.action}
            onDismiss={() => hide(current.key)}
            onClose={
              current.onClose &&
              (() => {
                hide(current.key);
                current.onClose?.();
              })
            }
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;

const styles = StyleSheet.create({
  host: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});
