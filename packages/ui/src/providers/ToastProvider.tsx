import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import Snackbar, {
  type SnackbarPosition,
  type SnackbarSeverity,
  type SnackbarVariant,
} from "../components/Snackbar";
import { SnackbarStack } from "../components/internal/SnackbarStack";
import { ToastLayersContext } from "../components/internal/ToastLayer";
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
   * Replaces any queued toast carrying the same id, in its place, instead of
   * appending one; a toast already on screen restarts its timer. Use it to
   * keep a repeated event (a retry, a poll) from stacking up.
   */
  id?: string;
}

interface QueuedToast extends ToastOptions {
  key: string;
  /** Bumped each time the toast is (re)queued: replacing by id remounts it and restarts its timer. */
  generation: number;
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
  /**
   * Keys currently queued, head first, read when you access it. It is not
   * reactive: `useToast()` returns the same object for the provider's whole
   * life, so reading it never re-renders a consumer.
   */
  readonly queue: string[];
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

/** The toasts on screen, one stack per position. */
const ToastViewport = ({
  stacks,
  hide,
}: {
  stacks: [SnackbarPosition, QueuedToast[]][];
  hide: (key: string) => void;
}) =>
  stacks.map(([at, toasts]) => (
    <SnackbarStack key={at} position={at}>
      {/* The newest is nearest the edge: first from a top edge, last from a bottom one. */}
      {(at.startsWith("top") ? [...toasts].reverse() : toasts).map((toast) => (
        <Snackbar
          // The generation remounts a replaced toast: the enter animation and the timer restart.
          key={`${toast.key}:${toast.generation}`}
          visible
          message={toast.message}
          severity={toast.severity}
          variant={toast.variant}
          position={at}
          icon={toast.icon}
          duration={toast.duration}
          action={toast.action}
          onDismiss={() => hide(toast.key)}
          onClose={
            toast.onClose &&
            (() => {
              hide(toast.key);
              toast.onClose?.();
            })
          }
        />
      ))}
    </SnackbarStack>
  ));

let counter = 0;
const nextKey = () => `toast-${++counter}`;
let generations = 0;

export interface ToastProviderProps {
  children: React.ReactNode;
  /** Where toasts appear unless one asks for another. Defaults to `"bottom-center"`. */
  position?: SnackbarPosition;
  /**
   * How many toasts are on screen together. The others wait in the queue and
   * appear, in order, as a slot frees. Defaults to `1`: one at a time. At a
   * given position they stack with a gap, the newest nearest the edge.
   */
  maxVisible?: number;
}

/**
 * Renders up to `maxVisible` toasts (one by default) from a FIFO queue, so a
 * burst of events plays back in order instead of overwriting itself.
 */
export const ToastProvider = ({
  children,
  position = "bottom-center",
  maxVisible = 1,
}: ToastProviderProps) => {
  const [queue, setQueue] = useState<QueuedToast[]>([]);
  // The queue also lives in a ref, so the API below can stay one object for
  // the provider's whole life: it changes nothing a consumer renders from.
  const queueRef = useRef<QueuedToast[]>([]);

  const api = useMemo<ToastApi>(() => {
    const commit = (next: QueuedToast[]) => {
      queueRef.current = next;
      setQueue(next);
    };
    const show = (options: ToastOptions) => {
      const key = options.id ?? nextKey();
      const toast = { ...options, key, generation: ++generations };
      const current = queueRef.current;
      // Same id: it takes the place of the one it replaces, as a new toast.
      const at = options.id
        ? current.findIndex((queued) => queued.key === options.id)
        : -1;
      commit(
        at < 0
          ? [...current, toast]
          : current.map((queued, index) => (index === at ? toast : queued)),
      );
      return key;
    };
    const hide = (key?: string) =>
      commit(
        key === undefined
          ? []
          : queueRef.current.filter((toast) => toast.key !== key),
      );
    return {
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
      get queue() {
        return queueRef.current.map((toast) => toast.key);
      },
    };
  }, []);

  const visible = queue.slice(0, Math.max(1, Math.floor(maxVisible) || 1));
  // One stack per position, in the order the toasts were raised.
  const stacks = new Map<SnackbarPosition, QueuedToast[]>();
  for (const toast of visible) {
    const at = toast.position ?? position;
    stacks.set(at, [...(stacks.get(at) ?? []), toast]);
  }

  const viewport = <ToastViewport stacks={[...stacks]} hide={api.hide} />;

  // The open overlays, oldest first: the last one is on top and draws the
  // toasts; with none open the root does.
  const [overlays, setOverlays] = useState<string[]>([]);
  const open = useCallback((id: string) => {
    setOverlays((current) => [...current, id]);
    return () => setOverlays((current) => current.filter((o) => o !== id));
  }, []);
  const top = overlays.length > 0 ? overlays[overlays.length - 1] : null;

  return (
    <ToastContext.Provider value={api}>
      <ToastLayersContext.Provider value={{ viewport, top, open }}>
        {children}
        {top === null && viewport}
      </ToastLayersContext.Provider>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
