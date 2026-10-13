import type { KeepAwakeAdapter } from "../keep-awake/types";

export interface MockKeepAwakeAdapter extends KeepAwakeAdapter {
  /** The tags holding the screen on right now. */
  readonly activeTags: readonly string[];
  /** True while at least one tag is active: the screen would stay on. */
  readonly isAwake: boolean;
}

/**
 * An in-memory `KeepAwakeAdapter` that records which tags hold the screen on.
 * Inject it with `<DeviceAdaptersProvider adapters={{ keepAwake }}>` and
 * assert on `isAwake`.
 */
export function createMockKeepAwakeAdapter({
  supported = true,
}: { supported?: boolean } = {}): MockKeepAwakeAdapter {
  const tags = new Set<string>();

  return {
    isSupported: () => supported,
    async activate(tag) {
      tags.add(tag);
    },
    async deactivate(tag) {
      tags.delete(tag);
    },
    get activeTags() {
      return [...tags];
    },
    get isAwake() {
      return tags.size > 0;
    },
  };
}
