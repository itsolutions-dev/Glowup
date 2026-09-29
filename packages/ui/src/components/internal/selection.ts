// The selection rules ToggleButtonGroup, ButtonGroup and ChipGroup share: one
// value, or a set of them.

export const isSelected = (
  value: string | string[] | null | undefined,
  item: string,
  multiSelect: boolean,
) =>
  multiSelect ? Array.isArray(value) && value.includes(item) : value === item;

/** `value` with `item` added, or removed if it was there. */
export const toggleIn = (value: unknown, item: string) => {
  const current = Array.isArray(value) ? (value as string[]) : [];
  return current.includes(item)
    ? current.filter((v) => v !== item)
    : [...current, item];
};

/** One choice of many is a radio group; several is a group of checkboxes. */
export const selectionRoles = (multiSelect: boolean) =>
  multiSelect
    ? { group: "none" as const, item: "checkbox" as const }
    : { group: "radiogroup" as const, item: "radio" as const };
