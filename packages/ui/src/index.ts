// Public API for @its/glowup-ui. Nothing outside this file is public: a module
// under src/ that is not re-exported here does not exist for consumers.

// --- Theme system ---
export * from "./providers/ThemeProvider";
export {
  useInteractionFeedback,
  type InteractionFeedbackHandler,
  type InteractionFeedbackKind,
} from "./providers/InteractionFeedback";
export * from "./providers/palettes";
export * from "./providers/toneFrom";
export { useDensity, type Density } from "./providers/Density";
export {
  default as ViewportProvider,
  type ViewportProviderProps,
} from "./providers/Viewport";
export * from "./providers/AlertProvider";
// ToastProvider is exported by name from the module itself.
export * from "./providers/ToastProvider";

// --- Hooks ---
export * from "./hooks/useDebounce";
export * from "./hooks/useBreakpoint";
export { useReduceMotion } from "./components/internal/useReduceMotion";

// --- Components ---
export { default as Accordion } from "./components/Accordion";
export type { AccordionProps } from "./components/Accordion";
export { default as AppBar } from "./components/AppBar";
export * from "./components/AppBar";
export { default as AspectRatio } from "./components/Layout/AspectRatio";
export * from "./components/Layout/AspectRatio";
export { default as Autocomplete } from "./components/Autocomplete";
export * from "./components/Autocomplete";
export { default as Avatar } from "./components/Avatar";
export type { AvatarProps } from "./components/Avatar";
export { default as Badge } from "./components/Badge";
export type { BadgeProps } from "./components/Badge";
export { default as Banner } from "./components/Banner";
export * from "./components/Banner";
export { default as Blink } from "./components/Blink";
export type { BlinkProps } from "./components/Blink";
export { default as BottomSheet } from "./components/BottomSheet";
export type { BottomSheetProps } from "./components/BottomSheet";
export { default as Box } from "./components/Layout/Box";
export * from "./components/Layout/Box";
export { default as Breadcrumbs } from "./components/Breadcrumbs";
export * from "./components/Breadcrumbs";
export { default as Button } from "./components/Button";
export type {
  ButtonVariant,
  ButtonColor,
  ButtonProps,
} from "./components/Button";
export { default as ButtonGroup } from "./components/ButtonGroup";
export * from "./components/ButtonGroup";
export { default as Card } from "./components/Card";
export type { CardProps } from "./components/Card";
export { default as CardActions } from "./components/CardParts/CardActions";
export * from "./components/CardParts/CardActions";
export { default as CardContent } from "./components/CardParts/CardContent";
export * from "./components/CardParts/CardContent";
export { default as CardCover } from "./components/CardParts/CardCover";
export * from "./components/CardParts/CardCover";
export { default as CardTitle } from "./components/CardParts/CardTitle";
export * from "./components/CardParts/CardTitle";
export { default as Carousel } from "./components/Carousel";
export type { CarouselProps } from "./components/Carousel";
export { default as Checkbox } from "./components/Checkbox";
export type { CheckboxProps } from "./components/Checkbox";
export { default as CheckboxGroup } from "./components/CheckboxGroup";
export * from "./components/CheckboxGroup";
export { default as Chip } from "./components/Chip";
export type { ChipProps } from "./components/Chip";
export { default as ChipGroup } from "./components/ChipGroup";
export * from "./components/ChipGroup";
export { default as Collapse } from "./components/Collapse";
export * from "./components/Collapse";
export { default as DataGrid } from "./components/DataGrid";
export * from "./components/DataGrid";
export { default as DatePicker } from "./components/DatePicker";
export * from "./components/DatePicker";
export { default as DateTimePicker } from "./components/DateTimePicker";
export { default as ConfirmDialog } from "./components/Dialog/ConfirmDialog";
export type { ConfirmDialogProps } from "./components/Dialog/ConfirmDialog";
export { default as Dialog } from "./components/Dialog/Dialog";
export type {
  DialogProps,
  DialogSlotStyles,
  DialogWidth,
} from "./components/Dialog/Dialog";
export { default as Divider } from "./components/Divider";
export type { DividerProps } from "./components/Divider";
export { default as EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";
export { default as FAB } from "./components/FAB";
export type { FABProps, FABSize, FABVariant } from "./components/FAB";
export { default as Form } from "./components/Form";
export type { FormProps } from "./components/Form";
export { default as FormControl } from "./components/FormControl";
export * from "./components/FormControl";
export { default as Grid } from "./components/Layout/Grid";
export * from "./components/Layout/Grid";
export { default as HelperText } from "./components/HelperText";
export * from "./components/HelperText";
export { default as Icon } from "./components/Icon";
export * from "./components/Icon";
export { default as IconButton } from "./components/IconButton";
export * from "./components/IconButton";
export { default as IFrame } from "./components/IFrame";
export type { IFrameProps } from "./components/IFrame";
export { default as Image } from "./components/Image";
export * from "./components/Image";
export { default as Input } from "./components/Input";
export type { InputProps } from "./components/Input";
export { default as Link } from "./components/Link";
export * from "./components/Link";
export { default as ListItem } from "./components/List/ListItem";
export type { ListItemProps } from "./components/List/ListItem";
export { default as ListSection } from "./components/List/ListSection";
export * from "./components/List/ListSection";
export { default as ListSubheader } from "./components/List/ListSubheader";
export * from "./components/List/ListSubheader";
export { default as Menu } from "./components/Menu";
export * from "./components/Menu";
export { default as NavBar } from "./components/NavBar";
export * from "./components/NavBar";
export { default as Drawer } from "./components/Drawer";
export * from "./components/Drawer";
export { default as NavigationRail } from "./components/NavigationRail";
export * from "./components/NavigationRail";
export { default as Pagination } from "./components/Pagination";
export type {
  PaginationProps,
  PaginationSize,
  PaginationVariant,
} from "./components/Pagination";
export { default as Paper } from "./components/Paper";
export type { PaperProps } from "./components/Paper";
export { default as PinInput } from "./components/PinInput";
export * from "./components/PinInput";
export { default as Popover } from "./components/Popover";
export * from "./components/Popover";
export { default as Portal } from "./components/Portal";
export * from "./components/Portal";
export { default as CircularProgress } from "./components/Progress/CircularProgress";
export * from "./components/Progress/CircularProgress";
export { default as LinearProgress } from "./components/Progress/LinearProgress";
export type {
  LinearProgressProps,
  LinearProgressLabelPosition,
} from "./components/Progress/LinearProgress";
export { default as ProgressButton } from "./components/ProgressButton";
export * from "./components/ProgressButton";
export { default as RadioButton } from "./components/RadioButton";
export * from "./components/RadioButton";
export { default as Rating } from "./components/Rating";
export type { RatingProps } from "./components/Rating";
export { default as SearchBar } from "./components/SearchBar";
export type { SearchBarProps } from "./components/SearchBar";
export { default as Select } from "./components/Select";
export * from "./components/Select";
export { default as Skeleton } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton";
export { default as Slider } from "./components/Slider";
export type { SliderProps } from "./components/Slider";
export { default as Snackbar } from "./components/Snackbar";
export * from "./components/Snackbar";
export { default as Spacer } from "./components/Layout/Spacer";
export * from "./components/Layout/Spacer";
export { default as SpeedDial } from "./components/SpeedDial";
export * from "./components/SpeedDial";
export { default as SplitButton } from "./components/SplitButton";
export * from "./components/SplitButton";
export { default as NumberField } from "./components/NumberField";
export type { NumberFieldProps } from "./components/NumberField";
export { default as Stack } from "./components/Layout/Stack";
export * from "./components/Layout/Stack";
export { default as Stat } from "./components/Stat";
export * from "./components/Stat";
export { default as CaptionValue } from "./components/CaptionValue";
export * from "./components/CaptionValue";
export { default as StatusBadge } from "./components/StatusBadge";
export type { StatusBadgeProps } from "./components/StatusBadge";
export { default as Stepper } from "./components/Stepper";
export * from "./components/Stepper";
export { default as TabContent } from "./components/Tab/TabContent";
export type { TabContentProps } from "./components/Tab/TabContent";
export { default as Tabs } from "./components/Tab/Tabs";
export type { TabProps as TabsProps } from "./components/Tab/Tabs";
export { default as Table } from "./components/Table";
export * from "./components/Table";
export { default as TimePicker } from "./components/TimePicker";
export * from "./components/TimePicker";
export { default as Switch } from "./components/Switch";
export type { SwitchProps } from "./components/Switch";
export { default as ToggleButton } from "./components/ToggleButton/ToggleButton";
export type { ToggleButtonProps } from "./components/ToggleButton/ToggleButton";
export { default as ToggleButtonGroup } from "./components/ToggleButton/ToggleButtonGroup";
export * from "./components/ToggleButton/ToggleButtonGroup";
export { default as Toolbar } from "./components/Toolbar";
export * from "./components/Toolbar";
export { default as Tooltip } from "./components/Tooltip";
export * from "./components/Tooltip";
export { default as TouchableRipple } from "./components/TouchableRipple";
export * from "./components/TouchableRipple";
export { default as Typography } from "./components/Typography";
export * from "./components/Typography";

// --- Date/time picker types + locale helpers ---
export type {
  DateTimePickerProps,
  DateTimePickerCommonProps,
  SingleDateTimePickerProps,
  RangeDateTimePickerProps,
  MultipleDateTimePickerProps,
  DateTimePickerMode,
  DateTimePickerVariant,
  DateTimePickerPresentation,
  DateSelectionMode,
  CalendarScrollMode,
  PickerInputType,
  DateRange,
  ValidRange,
  DateTimePickerLabels,
  DateTimePickerRelativeLabels,
  MinuteInterval,
} from "./components/DateTimePicker.shared";
export {
  DEFAULT_LABELS as DATE_TIME_PICKER_LABELS,
  EMPTY_RANGE,
  applyRangeSelection,
  toggleMultipleSelection,
  formatDateInput,
  parseDateInput,
  getDateInputHint,
  getDayPeriodNames,
  getDeviceLocale,
  getFirstDayOfWeek,
  getMonthNames,
  getShortMonthNames,
  getWeekdayNames,
  isLocale12Hour,
} from "./components/DateTimePicker.shared";

// --- Shared types ---
export * from "./components/types";
export * from "./components/Layout/tokens";
