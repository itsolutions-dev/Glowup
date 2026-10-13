/**
 * The contract between `useKeepAwake()` and whatever holds the screen on.
 * Several holders may be active at once, told apart by `tag`: the screen may
 * sleep again only once every tag is deactivated.
 */
export interface KeepAwakeAdapter {
  isSupported(): boolean;
  activate(tag: string): Promise<void>;
  /** Never throws for a tag that is unknown or still activating. */
  deactivate(tag: string): Promise<void>;
}
