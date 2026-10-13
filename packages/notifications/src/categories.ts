import * as Notifications from "expo-notifications";

import type { NotificationAction, NotificationCategory } from "./types";

function toAction(
  action: NotificationAction,
): Notifications.NotificationAction {
  return {
    identifier: action.id,
    buttonTitle: action.title,
    ...(action.textInput && { textInput: action.textInput }),
    options: {
      opensAppToForeground: action.opensApp ?? true,
      isDestructive: action.destructive ?? false,
      isAuthenticationRequired: action.authenticationRequired ?? false,
    },
  };
}

/**
 * Registers (or replaces) the categories. The provider runs this on mount, so
 * a notification that names a category shows its buttons from the first one.
 */
export async function registerCategories(
  categories: readonly NotificationCategory[],
): Promise<void> {
  await Promise.all(
    categories.map((category) =>
      Notifications.setNotificationCategoryAsync(
        category.id,
        category.actions.map(toAction),
      ),
    ),
  );
}
