import type {
  SecureStoreAdapter,
  SecureStoreOptions,
} from "../secure-store/types";

export interface MockSecureStoreAdapter extends SecureStoreAdapter {
  /** What is stored, by `"<service>/<key>"` (`"/<key>"` without a service). */
  readonly items: ReadonlyMap<string, string>;
  /** The options of every write, in order. */
  readonly writes: readonly { key: string; options: SecureStoreOptions }[];
  /** Makes the next call reject with this error (once). */
  failNext(error: Error): void;
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
  /** Initial items by `"<service>/<key>"` or `"/<key>"`. */
  items?: Record<string, string>;
} = {}): MockSecureStoreAdapter {
  const items = new Map(Object.entries(initial));
  const writes: { key: string; options: SecureStoreOptions }[] = [];
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
      }),
    get items() {
      return items;
    },
    get writes() {
      return writes;
    },
    failNext(error) {
      failure = error;
    },
  };
}
