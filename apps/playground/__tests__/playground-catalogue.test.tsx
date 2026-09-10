import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProvider,
  AlertProviderWrapper,
  ThemeProvider,
  ToastProvider,
} from "@its/glowup-ui";
import Playground from "../screens/Playground";

// Same provider chain App.tsx mounts — the kit's components read from all of it.
const renderPlayground = () =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <Playground />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );

// Kept in sync with CATEGORIES in ../catalogue/categories.ts. A component added to the
// catalogue but left without a working demo fails here rather than in someone's
// browser, which is the whole point of the screen.
const CATALOGUE = [
  // Foundations
  "Typography",
  "Divider",
  "Paper",
  "Card",
  "CardTitle",
  "CardContent",
  "CardCover",
  "CardActions",
  "Icon",
  "TouchableRipple",
  // Actions
  "Button",
  "IconButton",
  "Chip",
  "FAB",
  "AnimatedFAB",
  "SpeedDial",
  "ToggleButton",
  "ToggleButtonGroup",
  // Inputs
  "Input",
  "NumericInput",
  "Select",
  "Checkbox",
  "RadioButton",
  "RadioGroup",
  "Toggle",
  "Slider",
  "Spinner",
  "SearchBar",
  "Autocomplete",
  "PinInput",
  "FormControl",
  "DateTimePicker",
  "DatePicker",
  "DatePickerInput",
  "DateRangePicker",
  "TimePicker",
  "TimeSelect",
  "Calendar",
  "ClockPicker",
  "ClockDial",
  "Rating",
  "HelperText",
  // Data display
  "Avatar",
  "Badge",
  "IconBadge",
  "StatusBadge",
  "DataGrid",
  "ListItem",
  "ListSection",
  "ListSubheader",
  "Tooltip",
  "Accordion",
  "Carousel",
  "Stat",
  "Image",
  "Link",
  // Feedback
  "Snackbar",
  "Banner",
  "Modal",
  "ConfirmDialog",
  "Popover",
  "BottomSheet",
  "Menu",
  "Skeleton",
  "CircularProgress",
  "LinearProgress",
  "EmptyState",
  "Toast",
  "Collapse",
  "Portal",
  // Navigation
  "NavigationBar",
  "Tabs",
  "TabContent",
  "Breadcrumbs",
  "Pagination",
  "Stepper",
  "LanguageSelector",
  "DrawerPreferenceItem",
  // Layout
  "Box",
  "Stack",
  "Grid",
  "AspectRatio",
  "Center",
  "Spacer",
];

describe("Playground catalogue", () => {
  it("covers every catalogued component", async () => {
    const { getByText } = await renderPlayground();
    // Pins this list to the screen's own count, so adding a component to
    // CATEGORIES without adding it here fails instead of going untested.
    expect(getByText(`${CATALOGUE.length} components`)).toBeTruthy();
  });

  it.each(CATALOGUE)("renders the %s demo", async (name) => {
    const { getAllByText, getByText } = await renderPlayground();

    // The name appears in the nav list and again in the preview header; the
    // nav entry is the first one.
    const entries = getAllByText(name);
    expect(entries.length).toBeGreaterThan(0);
    await fireEvent.press(entries[0]);

    // The header counter proves the press actually selected this component —
    // without it, a press that did nothing would still pass.
    const index = String(CATALOGUE.indexOf(name) + 1).padStart(2, "0");
    expect(
      getByText(new RegExp(`· ${index} / ${CATALOGUE.length}$`)),
    ).toBeTruthy();
  });
});
