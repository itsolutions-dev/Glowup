import type {
  ProtectedErrorStatus,
  SecureStoreAdapter,
  SecureStoreOptions,
} from "../secure-store/types";

export interface MockSecureStoreAdapter extends SecureStoreAdapter {
  /**
   * What is stored, by `"<service>/<key>"` (`"/<key>"` without a service).
   * Protected items live under services the package derives, with a marker
   * item beside each.
   */
  readonly items: ReadonlyMap<string, string>;
  /** The protected items, by `"<derived service>/<key>"`. */
  readonly protectedItems: ReadonlyMap<string, string>;
  /** The options of every plain write, in order. */
  readonly writes: readonly { key: string; options: SecureStoreOptions }[];
  /** The prompt text of every protected read or write, in order. */
  readonly prompts: readonly string[];
  /** Makes the next call reject with this error (once). */
  failNext(error: Error): void;
  /** Makes the next protected call end with this prompt outcome (once). */
  denyNext(status: ProtectedErrorStatus): void;
  /**
   * What the platform does when the enrolled biometrics change: every
   * protected item is destroyed (their markers stay).
   */
  invalidate(): void;
}

/**
 * An in-memory `SecureStoreAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ secureStore }}>`.
 */
export function createMockSecureStoreAdapter({
  supported = true,
  items: initial = {},
}: {
  supported?: boolean;
  /** Initial plain items by `"<service>/<key>"` or `"/<key>"`. */
  items?: Record<string, string>;
} = {}): MockSecureStoreAdapter {
  const items = new Map(Object.entries(initial));
  const protectedItems = new Map<string, string>();
  const writes: { key: string; options: SecureStoreOptions }[] = [];
  const prompts: string[] = [];
  let failure: Error | null = null;
  const id = (key: string, { service }: SecureStoreOptions) =>
    `${service ?? ""}/${key}`;
  const call = async <T>(run: () => T): Promise<T> => {
    if (failure) {
      const error = failure;
      failure = null;
      throw error;
    }
    return run();
  };

  return {
    isSupported: () => supported,
    getItem: (key, options) => call(() => items.get(id(key, options)) ?? null),
    setItem: (key, value, options) =>
      call(() => {
        writes.push({ key, options });
        items.set(id(key, options), value);
      }),
    deleteItem: (key, options) =>
      call(() => {
        items.delete(id(key, options));
        protectedItems.delete(id(key, options));
      }),
    getProtectedItem: (key, options) =>
      call(() => {
        prompts.push(options.prompt);
        return protectedItems.get(id(key, options)) ?? null;
      }),
    setProtectedItem: (key, value, options) =>
      call(() => {
        prompts.push(options.prompt);
        protectedItems.set(id(key, options), value);
      }),
    get items() {
      return items;
    },
    get protectedItems() {
      return protectedItems;
    },
    get writes() {
      return writes;
    },
    get prompts() {
      return prompts;
    },
    failNext(error) {
      failure = error;
    },
    denyNext(status) {
      // The shape the hooks recognise (`ProtectedAccessError`), built here
      // because /testing may not import a capability's runtime code.
      failure = Object.assign(new Error(status), {
        name: "ProtectedAccessError",
        status,
      });
    },
    invalidate() {
      protectedItems.clear();
    },
  };
}
