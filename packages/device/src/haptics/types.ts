export type ImpactStyle = "light" | "medium" | "heavy";

export type NotificationFeedback = "success" | "warning" | "error";

/**
 * A UI interaction to answer with the platform's own feedback. The same
 * strings as `@its/glowup-ui`'s `InteractionFeedbackKind`, so `hapticFeedback`
 * plugs straight into `ThemeProvider`'s `onInteractionFeedback` (the two
 * packages never import each other).
 */
export type InteractionKind = "press" | "toggle" | "selection" | "longPress";

/** The contract between the haptics hooks and the platform. */
export interface HapticsAdapter {
  isSupported(): boolean;
  impact(style: ImpactStyle): Promise<void>;
  notification(type: NotificationFeedback): Promise<void>;
  selection(): Promise<void>;
  /** The platform's feedback for a UI interaction. */
  interaction(kind: InteractionKind): Promise<void>;
}
