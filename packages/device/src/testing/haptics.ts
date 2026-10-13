import type {
  HapticsAdapter,
  ImpactStyle,
  InteractionKind,
  NotificationFeedback,
} from "../haptics/types";

export type HapticEvent =
  | { type: "impact"; style: ImpactStyle }
  | { type: "notification"; feedback: NotificationFeedback }
  | { type: "selection" }
  | { type: "interaction"; kind: InteractionKind };

export interface MockHapticsAdapter extends HapticsAdapter {
  /** Every haptic played, in order. */
  readonly events: readonly HapticEvent[];
  clear(): void;
}

/**
 * An in-memory `HapticsAdapter` that records what would have been played.
 * Inject it with `<DeviceAdaptersProvider adapters={{ haptics }}>`.
 */
export function createMockHapticsAdapter({
  supported = true,
}: { supported?: boolean } = {}): MockHapticsAdapter {
  const events: HapticEvent[] = [];
  const record = async (event: HapticEvent) => {
    events.push(event);
  };
  return {
    isSupported: () => supported,
    impact: (style) => record({ type: "impact", style }),
    notification: (feedback) => record({ type: "notification", feedback }),
    selection: () => record({ type: "selection" }),
    interaction: (kind) => record({ type: "interaction", kind }),
    get events() {
      return events;
    },
    clear() {
      events.length = 0;
    },
  };
}
