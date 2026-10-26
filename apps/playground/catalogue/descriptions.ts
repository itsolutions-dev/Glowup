/**
 * One sentence about each component: what it is for. It sits under the title on
 * the component's page, in its search result and in the gallery card, and it is
 * the page's meta description, so it says what the component does in plain
 * words rather than naming the library. A catalogued component without one
 * fails the catalogue test.
 */
export const DESCRIPTIONS: Record<string, string> = {
  // Foundations
  Typography:
    "Text in the Material 3 type scale, with theme colours, alignment and truncation.",
  Divider:
    "A thin rule that separates content, horizontal or vertical, with an optional centred label.",
  Paper:
    "A surface with elevation, an outline and rounded corners: the base other containers sit on.",
  Card: "A grouped, pressable surface for one entity, with a title, cover, content and actions.",
  CardTitle:
    "The header row of a Card: a title, a subtitle and optional icons at either end.",
  CardContent:
    "The body of a Card: spaces its text and other content between the header and the actions.",
  CardCover: "A full-width image or media block at the edge of a Card.",
  CardActions: "The row of buttons at the bottom of a Card.",
  Icon: "An icon from a glyph name, an image, an element or a render function, at any size and colour.",
  TouchableRipple:
    "A pressable with the Material state layer and ripple, for building your own touch targets.",

  // Actions
  Button:
    "The main action control: filled, tonal, outlined or text, with colour roles, icons and a loading state.",
  ProgressButton:
    "A button that shows an action's progress, success and failure in place, then goes back to idle.",
  IconButton:
    "A compact button that holds only an icon, with variants, colour roles, a tooltip and a badge.",
  Chip: "A compact element for a filter, a choice, an input or an action, with an optional icon and close button.",
  ChipGroup:
    "A set of chips that works as one control, for a single or a multiple choice.",
  FAB: "A floating button for the screen's main action, as an icon, an extended label or an animated one.",
  SpeedDial: "A floating button that opens a stack of related actions.",
  ToggleButton: "A button with an on and an off state, alone or in a group.",
  ToggleButtonGroup:
    "A group of toggle buttons for a single or a multiple choice, like a segmented control.",
  ButtonGroup:
    "Connected buttons that share one selection, in a standard or a connected layout.",
  SplitButton:
    "A button with a main action and, beside it, a menu of related actions.",
  Clipboard:
    "A copy button that writes a text to the clipboard and confirms it, with a hook for your own trigger.",
  Download:
    "A button that saves a file from data you hold or from a URL, on the web and on a phone.",

  // Inputs
  Input:
    "A single-line text field with a label, helper and error text, icons, prefixes and number formatting.",
  InputArea:
    "A multi-line text field that keeps a fixed height or grows with its text, up to a limit you set.",
  PasswordField:
    "A password field with a show and hide button, autofill hints and an optional strength meter.",
  Select: "A dropdown to choose one or several options from a list.",
  Checkbox: "A box that switches a choice on or off, with an in-between state.",
  CheckboxGroup: "A labelled set of checkboxes that share one array value.",
  RadioButton: "One option of a set from which only one can be chosen.",
  RadioGroup: "A labelled set of radio buttons with one selected value.",
  Switch: "An on and off toggle for a setting that takes effect at once.",
  Slider:
    "Picks a number in a range by dragging, with optional steps and marks.",
  NumberField: "A numeric field with step buttons, limits and keyboard entry.",
  SearchBar:
    "A rounded search field with a clear button, a debounce and a loading state.",
  Autocomplete:
    "A text field that suggests options as you type, for one or several values, local or async.",
  PinInput:
    "Separate cells for a one-time code or a PIN, with paste and automatic advance.",
  Editable:
    "Text that turns into a field when you click it, for a name, a note, a number or a choice, kept on Enter or blur.",
  FormControl:
    "Wraps a field with a label, helper text and a shared disabled and error state.",
  DateTimePicker:
    "Picks a date, a time or both, in a popover, a dialog or inline, as one value, a range or several.",
  DatePicker: "Picks a date or a date range from a field and a calendar.",
  TimePicker: "Picks a time on a clock dial or by typing it.",
  Rating: "A star rating, or any icon, with half steps and a hover preview.",
  HelperText: "The small line under a field for hints and validation messages.",
  Upload:
    "Selects files by dialog or drag and drop and uploads them, with a progress bar, retry and cancel per file.",

  // Data Display
  Avatar:
    "A person's photo, initials or icon in a circle, with a size and a presence status.",
  Badge: "A small count or dot attached to another element.",
  StatusBadge:
    "A pill that states a status, success, warning or error, with an icon.",
  DataGrid:
    "A virtualised grid for large data sets, with sorting, custom cells and row density.",
  Table:
    "A table drawn from columns and data, with a fixed header, paging, hover, selection and row clicks.",
  ListItem:
    "One row of a list: an icon, primary and secondary text, and an action.",
  ListSection: "A group of list items under a title, with an optional divider.",
  ListSubheader: "A small heading that labels a group of list items.",
  Tooltip:
    "A short label shown on hover or focus, or on long press on touch, with an optional action.",
  Accordion: "A header that opens and closes a panel of content.",
  Carousel:
    "A swipeable set of slides with dots, arrows and optional autoplay.",
  Stat: "A key figure with its label, an optional trend and a change.",
  CaptionValue:
    "A caption and its value as a pair, with a fallback, copying and truncation.",
  Image: "An image with a fixed ratio, a fit mode and a fallback.",
  Link: "Text that opens an address or runs an action, styled and announced as a link.",
  CodeBlock:
    "Syntax-coloured code with line numbers, marked lines and a copy button.",
  IFrame: "Embeds a web page in a frame (a notice on iOS and Android).",
  Blink: "Pulses its content in opacity to draw attention.",
  QrCode:
    "Draws any text, such as a link or a Wi-Fi login, as a QR code you can scan, with its own encoder and an optional logo.",
  Tree: "A hierarchy of rows that open and close, with selection or checkboxes, lazy loading and keyboard navigation.",

  // Feedback
  Snackbar:
    "A brief message at the edge of the screen, with a severity and an optional action.",
  Banner:
    "A persistent message at the top of a screen or a section, with actions.",
  Dialog:
    "A modal window for one focused task: a title, content, actions and an optional form.",
  AlertDialog:
    "A dialog that interrupts to say something or ask for confirmation and waits for an answer: a status icon and one or two actions, one of them destructive.",
  Form: "Groups fields and submits them: Enter submits on the web, and a submit button does it everywhere.",
  Popover:
    "Floating content anchored to an element and placed against its edges.",
  HoverCard:
    "A card with more about its trigger, shown on hover or focus on the web and on long press on touch.",
  BottomSheet:
    "A panel that slides up from the bottom for secondary content or actions.",
  Menu: "A list of actions in a floating panel anchored to a trigger.",
  Skeleton: "A placeholder shaped like the content that is still loading.",
  CircularProgress:
    "A ring or a spinner that shows progress or waiting, with an optional label.",
  LinearProgress:
    "A bar that shows progress or waiting, with an optional label.",
  EmptyState:
    "A message for a screen that has nothing to show yet, with an action.",
  Toast:
    "Short messages queued from anywhere in the tree with the useToast hook.",
  Collapse: "Animates a section open and closed, down to a collapsed height.",
  Portal: "Renders its children in a host above the rest of the tree.",

  // Navigation
  AppBar:
    "The top bar of a screen: a title, a navigation icon and actions, in small, centered, medium or large sizes.",
  NavBar:
    "Bottom navigation for three to five destinations, with icons, labels and badges.",
  NavigationRail: "A vertical rail of destinations for tablets and desktops.",
  Drawer:
    "A side panel of navigation, permanent beside the content or sliding over it.",
  Toolbar: "A docked or floating bar of actions.",
  Tabs: "Switches between views with tabs, in a standard or a rounded style.",
  TabContent: "The content that belongs to the selected tab.",
  Breadcrumbs: "The path to the current page, with links back up.",
  Pagination:
    "Moves between pages of results with numbers, arrows and a page picker.",
  Stepper:
    "Shows progress through a sequence of steps, horizontal or vertical.",

  // Layout
  Box: "The basic layout block: padding, margin, background, radius and flex presets.",
  Stack: "Lays children out in a row or a column with spacing and dividers.",
  Grid: "A 12-column responsive grid, with container and item sizes per breakpoint.",
  AspectRatio: "Keeps its child at a fixed width-to-height ratio.",
  Spacer: "Fixed or flexible empty space between elements.",
  Center:
    "Centres its children within itself on both axes, as a row or a column.",
  AbsoluteCenter:
    "Centres an element on its parent's box without moving the parent's other content.",
  Break:
    "Lets an element run out to the edges of its padded container by cancelling the padding.",
  Visible:
    "Shows or hides part of a screen by a condition or the window's size class, with a fallback.",
  ScrollArea:
    "A scrollable area with themed scrollbars on web and native, a draggable thumb and automatic hiding.",
};

/** The sentence for a component, or a plain fallback for one not listed yet. */
export const descriptionOf = (name: string, category = "UI"): string =>
  DESCRIPTIONS[name] ??
  `${name}, a ${category.toLowerCase()} component for React Native and the web.`;
