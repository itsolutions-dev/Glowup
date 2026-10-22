import { ChipGroup } from "@its/glowup-ui";

import { ICON_STYLES, type IconStyle } from "./iconCatalog";

/** The Contained / Outlined filter of the icon search, on the page and in the picker. */
export const IconStyleFilter = ({
  value,
  onChange,
}: {
  value: IconStyle;
  onChange: (style: IconStyle) => void;
}) => (
  <ChipGroup
    accessibilityLabel="Icon style"
    value={value}
    // A chip cannot be switched off: choosing "All" is how a filter is cleared.
    required
    onChange={(next: string | null) => next && onChange(next as IconStyle)}
    options={ICON_STYLES}
  />
);

export default IconStyleFilter;
