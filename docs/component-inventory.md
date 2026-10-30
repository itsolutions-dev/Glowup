# Inventario dei componenti di `@its/glowup-ui`

File **generato** da `npm run docgen -w @its/glowup-playground && npm run inventory -w @its/glowup-playground`: non si modifica a mano
(salvo l'elenco "Altre aggiunte", che sta nello script `apps/playground/docgen/inventory.mjs`). Confronto con il commit `14a148f`,
prima della prima modifica della libreria di questo lavoro (versione 0.11.1, 102 componenti).
Ora: versione 0.11.1, 116 componenti.

Legenda: `*` accanto al nome = prop obbligatoria. «nuova» = non c'era all'inizio; «cambiata» = tipo, obbligatorietà o default diversi.

## Riepilogo

| Stato | Componenti | Prop in totale |
| ----- | ---------- | -------------- |
| Aggiunti | 28 | 379 |
| Aggiornati | 55 | 714 |
| Tenuti (invariati) | 33 | 195 |

## Aggiunti

- [AbsoluteCenter](#absolutecenter)
- [AlertDialog](#alertdialog)
- [Blink](#blink)
- [Break](#break)
- [CaptionValue](#captionvalue)
- [CheckboxGroup](#checkboxgroup)
- [Clipboard](#clipboard)
- [CodeBlock](#codeblock)
- [Dialog](#dialog)
- [Download](#download)
- [Drawer](#drawer)
- [Editable](#editable)
- [Form](#form)
- [FormField](#formfield)
- [HighlightedCode](#highlightedcode)
- [HoverCard](#hovercard)
- [IFrame](#iframe)
- [InputArea](#inputarea)
- [NavBar](#navbar)
- [NumberField](#numberfield)
- [PasswordField](#passwordfield)
- [QrCode](#qrcode)
- [ScrollArea](#scrollarea)
- [Switch](#switch)
- [Tree](#tree)
- [Upload](#upload)
- [ViewportProvider](#viewportprovider)
- [Visible](#visible)

## Aggiornati

- [Accordion](#accordion): + expanded, icon, onClick, variant · − onPress, startExpanded
- [AppBar](#appbar): + actions, divider, elevated, leading, paper, safeArea, style, subtitle, testID, title, variant · ~ navigation, options, route
- [AspectRatio](#aspectratio): + align, background, borderColor, borderWidth, children, gap, justify, margin, padding, radius, style, variant, width, wrap
- [Autocomplete](#autocomplete): comportamento · + onChange, allowCustomValue, debounce, defaultOptions, fullWidth, labelPlacement, multiple, onSearch, onSelectedChange, selected, variant · ~ filter · − onChangeText, onSelect
- [Avatar](#avatar): + onClick · ~ size · − onPress
- [Badge](#badge): + color, position
- [Banner](#banner): comportamento
- [BottomSheet](#bottomsheet): comportamento · + onClose, actions, showCloseButton, testID · − onDismiss
- [Box](#box): + background, children, margin, padding, style, variant · ~ gap · − bg, flex, m, mb, ml, mr, mt, mx, my, p, pb, pl, pr, pt, px, py, row
- [Button](#button): comportamento · + badge, color, density, onClick, type, variant · ~ iconPosition · − mode, onPress, tone
- [Card](#card): + onClick, selected · − onPress
- [CardTitle](#cardtitle): + endIcon, startIcon · − left, right
- [Center](#center): + align, background, children, direction, justify, margin, padding, style · ~ gap · − bg, flex, m, mb, ml, mr, mt, mx, my, p, pb, pl, pr, pt, px, py, row
- [Chip](#chip): + border, color, onClick, toneFrom, variant · ~ size · − mode, onPress
- [ChipGroup](#chipgroup): + onChange, multiple, variant · − onValueChange, mode, multiSelect
- [CircularProgress](#circularprogress): + label, labelPosition, trackColor
- [DataGrid](#datagrid): comportamento · + emptyState, height, hover, onClick, rowsPerPage, selected, tableTitle, width · ~ density, emptyMessage, rowStyle
- [DatePicker](#datepicker): + fieldVariant, presentation, showOkButton, showToday, variant
- [DateTimePicker](#datetimepicker): + fieldVariant, presentation, showOkButton, showToday, variant
- [DrawerItem](#draweritem): + children, defaultExpanded, onClick, onToggle · − onPress
- [DrawerSection](#drawersection): + collapsible, defaultExpanded, onToggle
- [FAB](#fab): + onClick, animateFrom, duration, extended, iconMode, testID, variant · ~ feedback, placement, position, size · − onPress
- [Grid](#grid): + autoSize, children, container, size, style, wrap · ~ columns, spacing · − minChildWidth
- [HStack](#hstack): + background, children, dividers, margin, padding, style · ~ spacing · − bg, flex, m, mb, ml, mr, mt, mx, my, p, pb, pl, pr, pt, px, py
- [IconButton](#iconbutton): + badge, color, onClick, title, variant · − mode, onPress
- [Input](#input): comportamento · + onChange, allUpperCase, decimalSeparator, density, endAdornment, fullWidth, inputProps, inputRef, labelPlacement, reserveHelperText · ~ minHeight · − onChangeText, multiline, numberOfLines
- [LinearProgress](#linearprogress): + label, labelPosition, width · ~ height
- [ListItem](#listitem): comportamento · + primaryText, action, dimmed, disabled, icon, indicatorColor, onClick, primaryTextStyle, secondaryText, secondaryTextStyle, testID, trailingWidth, variant · − children, itemSecondaryTextStyle, itemTextStyle, leading, onPress, secondary, trailing
- [ListSection](#listsection): + gap, showDividers
- [Menu](#menu): + onClose, anchorPosition, dividers, onClick, selected · − onDismiss
- [NavigationRail](#navigationrail): ~ items
- [Pagination](#pagination): + activePage, onChange, color, pageSelect, size, variant · − onPageChange, page
- [PinInput](#pininput): + onChange, variant · − onChangeText
- [Popover](#popover): + anchorPosition
- [ProgressButton](#progressbutton): + onClick, type, variant · − mode, onPress
- [Rating](#rating): + icon, interval, required
- [SearchBar](#searchbar): + onChange, debounceTime, icon, showLoading · − onChangeText, leadingIcon
- [Select](#select): comportamento · + density, disabledOptions, emptyMessage, fullWidth, labelPlacement, multiple, nullable, onChange · ~ value · − onSelect, multiSelect, selectedValues, toggleOptions
- [Slider](#slider): + interaction
- [Snackbar](#snackbar): comportamento · + onClose, position, severity, variant · ~ action, onDismiss · − type
- [Stack](#stack): + align, background, borderColor, borderWidth, children, dividers, height, justify, margin, padding, radius, style, width, wrap · ~ spacing
- [Stat](#stat): + direction, trendColor · − invertTrendColors
- [StatusBadge](#statusbadge): + toneFrom
- [Stepper](#stepper): + direction, onClick · − onStepPress
- [Table](#table): + columns, data, emptyMessage, height, hover, onClick, rowsPerPage, selected, tableTitle, testID, width · ~ children
- [TableCell](#tablecell): + align, flex
- [TableHeaderCell](#tableheadercell): comportamento · + align, flex, onClick · − onPress
- [TableRow](#tablerow): + hover, onClick, selected, testID
- [Tabs](#tabs): comportamento · + activeKey, color, fullWidth, height, showBorders, size, testID, variant, width · ~ onChange, tabs, activeTab
- [ThemeProvider](#themeprovider): + density, themeScrollbars
- [TimePicker](#timepicker): + fieldVariant, presentation, showOkButton, showToday, variant
- [ToastProvider](#toastprovider): + maxVisible, position
- [Tooltip](#tooltip): + anchorAccessible · ~ content
- [Typography](#typography): + align, color, fontSize, nowrap, onClick · ~ variant
- [VStack](#vstack): + background, children, dividers, margin, padding, style · ~ spacing · − bg, flex, m, mb, ml, mr, mt, mx, my, p, pb, pl, pr, pt, px, py

## Tenuti

[AlertProvider](#alertprovider) · [AlertProviderWrapper](#alertproviderwrapper) · [Breadcrumbs](#breadcrumbs) · [ButtonGroup](#buttongroup) · [CardActions](#cardactions) · [CardContent](#cardcontent) · [CardCover](#cardcover) · [Carousel](#carousel) · [Checkbox](#checkbox) · [Collapse](#collapse) · [Divider](#divider) · [EmptyState](#emptystate) · [FormControl](#formcontrol) · [HelperText](#helpertext) · [Icon](#icon) · [Image](#image) · [Link](#link) · [ListSubheader](#listsubheader) · [Paper](#paper) · [Portal](#portal) · [PortalHost](#portalhost) · [RadioButton](#radiobutton) · [RadioGroup](#radiogroup) · [Skeleton](#skeleton) · [Spacer](#spacer) · [SpeedDial](#speeddial) · [SplitButton](#splitbutton) · [TabContent](#tabcontent) · [TableHead](#tablehead) · [ToggleButton](#togglebutton) · [ToggleButtonGroup](#togglebuttongroup) · [Toolbar](#toolbar) · [TouchableRipple](#touchableripple)

## Altre aggiunte (non componenti)

| Genere | Cosa | Quando |
| ------ | ---- | ------ |
| Hook | `useDebouncedValue(value, delayMs)`, `useDebouncedCallback(fn, delayMs)` (with `cancel`, `flush`) | Fase 2, lotto 2A |
| Hook | `useBreakpoint(overrides?)`, `sizeClassFor(width)`, `SIZE_CLASSES` (window size classes M3) | Fase 2, lotto 2A |
| Hook | `useReduceMotion()` (già interno, ora esportato) | Fase 2, lotto 2A |
| Hook | `useDensity(prop?)` e tipo `Density` (`"normal" \| "dense"`) | Fase 3, lotto 3A |
| Utility | `toneFromColor(hex, mode)`, `toneFromString(text, mode)`, `toneFrom(source, mode)`, tipo `ToneColors` | Fase 2, lotto 2B |
| Token del tema | `success`, `warning`, `info`, `neutral`, ciascuno con `on…`, `…Container`, `on…Container` (16 token, chiaro e scuro), tipo `ThemeStatusTokens` | Fase 2, lotto 2B |
| Provider | `ThemeProvider density` (default di `Input`, `Select`, `Button`, `DataGrid`) | Fase 3, lotto 3A |
| Tipo | `TableAlign` (`left`, `center`, `right`), `TabItem` (`label`, `icon?`, `key?`, `disabled?`), `SnackbarSeverity` (`success`, `info`, `warning`, `error`) | Fase 3 |
| Sotto-tipo | `DataGrid` `columns[]` (`ColumnDefinition`): nuove `align`, `renderCell(value, row, index)` | Fase 3, lotto 3A |
| Sotto-tipo | `Tabs` `tabs[]`: oggetti con `key` e `disabled` (oltre a `label` e `icon`) | Fase 3, lotto 3B |
| Sotto-tipo | `useToast()`: nuovi `warning(message, options?)` e `info(message, options?)` | Fase 3, lotto 3B |

---

# Componenti aggiunti

### AbsoluteCenter

`packages/ui/src/components/Layout/AbsoluteCenter.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| axis | `"both" \| "horizontal" \| "vertical"` | "both" |  | Which axis the child is centred on. On the other axis it keeps its normal place (the start, or the full width of a vertically centred child). Defaults to `"both"`. |
| children | `React.ReactNode` |  |  |  |

### AlertDialog

`packages/ui/src/components/Dialog/AlertDialog.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| visible * | `boolean` |  |  | Whether the dialog is on screen. |
| actionText | `string` | "OK" |  | Label of the primary action. Defaults to `"OK"`. |
| cancelText | `string` |  |  | Label of the secondary action, drawn before the primary one. Left out, the alert has the primary action only. |
| children | `React.ReactNode` |  |  | More body under the `message`, or in its place: a string or any node. |
| destructive | `boolean` | false |  | Draws the primary action in the error tone (delete, discard). |
| disableBackdropClick | `boolean` | true |  | Keeps a click on the backdrop from calling `onCancel`: an alert needs an answer. Set `false` to let it dismiss. Defaults to `true`. |
| disableEscapeKeyDown | `boolean` | true |  | Keeps Escape (web) and Android back from calling `onCancel`. Set `false` to let them dismiss. Defaults to `true`. |
| icon | `IconSource` |  |  | Hero glyph above the title; takes the place of the `severity` icon. |
| loading | `boolean` | false |  | The primary action shows a spinner and does nothing, the secondary one is disabled, and the alert stays until `visible` goes down: dismissing it is off while it works. |
| message | `string` |  |  | What the alert says. With the `children`, it is the dialog's accessible description. |
| onAction | `() => void` |  |  | Called when the primary action is pressed. |
| onCancel | `() => void` |  |  | Called when the secondary action is pressed, and when the backdrop, Escape or Android back dismiss the alert (once enabled). |
| severity | `AlertDialogSeverity` |  |  | Puts a status icon above the title, in the colour of the status role. Left out, no icon. |
| slotStyles | `DialogSlotStyles` |  |  | As `Dialog`; `actions` covers the buttons and `title` the headline. |
| testID | `string` | "alert-dialog" |  | Root testID. The buttons get `${testID}-cancel` and `${testID}-action`. Defaults to `"alert-dialog"`. |
| title | `string` |  |  | The headline. It is the dialog's accessible name. |

### Blink

`packages/ui/src/components/Blink.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| active | `boolean` | true |  | Blinks while true; stays at full opacity while false. Defaults to `true`. |
| children | `React.ReactNode` |  |  | What blinks: a dot, a badge, a line of text. |
| interval | `number` | 600 |  | Milliseconds one half of a blink takes: the fade down to `minOpacity`, and again the fade back up. Defaults to 600. |
| minOpacity | `number` | 0.2 |  | The opacity at the dimmest point of a blink, from 0 to 1. Defaults to 0.2. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Break

`packages/ui/src/components/Layout/Break.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| block | `SpacingValue` |  |  | Breaks out on both vertical edges: a spacing token or px. |
| blockEnd | `SpacingValue` |  |  | Breaks out at the bottom; wins over `block`. |
| blockStart | `SpacingValue` |  |  | Breaks out at the top; wins over `block`. |
| children | `React.ReactNode` |  |  |  |
| inline | `SpacingValue` |  |  | Breaks out on both horizontal edges: a spacing token or px. |
| inlineEnd | `SpacingValue` |  |  | Breaks out at the end edge (right in LTR); wins over `inline`. |
| inlineStart | `SpacingValue` |  |  | Breaks out at the start edge (left in LTR); wins over `inline`. |

### CaptionValue

`packages/ui/src/components/CaptionValue.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| caption | `React.ReactNode` |  |  | The label: "Phone", "Due date". Text, or any node. |
| captionColor | `ThemeColor` |  |  | A theme colour token (`"primary"`, `"onSurfaceVariant"`, ...) or any colour string. Defaults to `onSurfaceVariant`. |
| captionStyle | `StyleProp<TextStyle>` |  |  |  |
| copy | `ClipboardWriter` |  |  | Writes the copied text: `expo-clipboard`'s `setStringAsync` on native, or your own on web. On web it defaults to `navigator.clipboard.writeText`. |
| direction | `"column" \| "row"` | "column" |  | `"column"` stacks the caption over the value, `"row"` puts them side by side. |
| enableCopy | `boolean` | false |  | Shows a small copy button (a `Clipboard`) after the value, for a text or number value (a node has nothing to copy). On web it writes the value to the clipboard (`navigator.clipboard`); the library has no clipboard dependency, so on native the button is shown only with a `copy` writer or an `onCopy` that does the copying. The button's icon changes to a check for a moment, and "Copied" is announced, once the value is copied. |
| fallback | `React.ReactNode` | "N/A" |  | Drawn when `value` is empty (`null`, `undefined`, `""` or `false`; `0` is a value). Defaults to `"N/A"`. |
| flex | `number` |  |  | Flex of the pair in its parent. |
| gap | `number` | 4 |  | Space between the caption and the value, in px. Defaults to 4. |
| height | `DimensionValue` |  |  | Height of the pair. |
| numberOfLines | `number` | 1 |  | Lines the value may use before it is cut with an ellipsis; `0` is no limit. Defaults to 1. |
| omitCaption | `boolean` | false |  | Draws no caption at all, instead of an empty line. |
| onCopy | `(value: string) => void` |  |  | Called with the value as text after it was copied. Without a `copy` writer it is, on native, where the app copies it; on web it is called after the clipboard write succeeded. |
| padding | `number` |  |  | Padding around the pair, in px. |
| reverse | `boolean` | false |  | Puts the value before the caption. |
| showTooltip | `boolean` | false |  | Wraps a text or number value in a `Tooltip` with the value as its content: the value in full, for when `numberOfLines` cuts it. |
| style | `StyleProp<ViewStyle>` |  |  | For anything the props above do not cover. |
| testID | `string` |  |  |  |
| textAlign | `TextStyle["textAlign"]` |  |  |  |
| value | `React.ReactNode` |  |  | The value. Text and numbers are drawn in the theme's type; any other node as given. |
| valueColor | `ThemeColor` |  |  | A theme colour token (`"primary"`, `"error"`, ...) or any colour string. Defaults to `onSurface`. |
| valueStyle | `StyleProp<TextStyle>` |  |  |  |
| width | `DimensionValue` |  |  | Width of the pair. |

### CheckboxGroup

`packages/ui/src/components/CheckboxGroup.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(values: any[]) => void` |  |  | Receives the new set of checked values after each toggle. |
| options * | `CheckboxOption[]` |  |  |  |
| value * | `any[]` |  |  | The values of the checked options. |
| direction | `"column" \| "row"` | "column" |  | Stacks the options (`"column"`) or lays them in a wrapping line (`"row"`). Defaults to `"column"`. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  | Error text below the group; it also turns the checkboxes and the label red. |
| feedback | `boolean` | true |  | Report each toggle to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| helperText | `string` |  |  | Supporting text below the group; hidden while an error is shown. |
| label | `string` |  |  |  |
| required | `boolean` |  |  | Marks the label with an asterisk. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Clipboard

`packages/ui/src/components/Clipboard.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| value * | `string` |  |  | The text a press copies. |
| children | `\| React.ReactNode \| ((state: { copied: boolean; copy: () => Promise<boolean>; }) => React.ReactNode)` |  |  | Draws your own trigger instead of the default icon button. A node is the content of a pressable (a button inside it would nest buttons: draw the trigger yourself for that); a function gets `{ copied, copy }`, `copy` copying `value`, and is drawn as returned, the trigger being yours. |
| color | `ColorRole` |  |  | Colour role of the default `IconButton`. The confirmation is always `success`. |
| copiedLabel | `string` | "Copied" |  | Accessible label of the trigger after the copy, also announced to screen readers. Defaults to `"Copied"`. |
| copy | `ClipboardWriter` |  |  | Writes the text. On web it defaults to `navigator.clipboard.writeText` (with an `execCommand("copy")` fallback). On native there is no default: pass one (`expo-clipboard`'s `setStringAsync`), or the trigger is drawn only with an `onCopy` that does the copying, and nothing without either. |
| disabled | `boolean` |  |  |  |
| label | `string` | "Copy" |  | Accessible label of the trigger before the copy. Defaults to `"Copy"`. |
| onCopy | `(value: string) => void` |  |  | Called with `value` after it was copied. |
| size | `IconButtonSize` | "large" |  | Size of the default `IconButton`. Defaults to `"large"`, the 48 dp touch target; `"small"` suits a button beside a value. |
| style | `StyleProp<ViewStyle>` |  |  | Style of the trigger. |
| testID | `string` |  |  |  |
| timeout | `number` |  |  | How long the confirmation (the check, `copied`) shows, in ms. Defaults to 1500. |
| variant | `IconButtonVariant` | "standard" |  | Container style of the default `IconButton`. Defaults to `"standard"`. |

### CodeBlock

`packages/ui/src/components/CodeBlock.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| code * | `string` |  |  | The source to show. |
| accessibilityLabel | `string` |  |  | Read by screen readers as the name of the block. Defaults to the title, or "{LANGUAGE} code". |
| copy | `ClipboardWriter` |  |  | Writes the copied text: `expo-clipboard`'s `setStringAsync` on native. On web it defaults to `navigator.clipboard.writeText`. |
| copyable | `boolean` | true |  | Shows a copy button in the header. On web it works as is; on native it is drawn only with a `copy` writer or an `onCopy`. Defaults to `true`. |
| highlightLines | `number[]` |  |  | Lines to mark with a band and an accent edge, counted from 1. |
| language | `CodeLanguage` | "tsx" |  | What it is written in, for the colours. Defaults to `"tsx"`. |
| maxHeight | `DimensionValue` |  |  | Height of the block's body before it scrolls vertically. Left out, it grows with the code. |
| onCopy | `(code: string) => void` |  |  | Called with the code after the copy button copied it. |
| showLineNumbers | `boolean` | false |  | Numbers the lines, in a gutter that is not selected with the code. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| title | `string` |  |  | Shown above the snippet: a file name, or what it is for. Defaults to the language's name. |
| wrap | `boolean` | false |  | Wraps long lines instead of scrolling the block sideways. |

### Dialog

`packages/ui/src/components/Dialog/Dialog.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode \| string` |  |  |  |
| visible * | `boolean` |  |  | Whether the dialog is on screen. |
| actions | `React.ReactNode` |  |  | Trailing action row. Replaces the single `closeText` button. In a full-screen dialog it moves into the header, after the title. |
| animationType | `"none" \| "slide" \| "fade"` | "fade" |  |  |
| closeIcon | `MaterialCommunityIconsGlyphs \| React.ReactElement \| false` | "close" |  | The close icon in the header, shown while `onClose` is set: a glyph name, your own element, or `false` to hide it. Hidden, a dialog without `actions` falls back to a text button labelled `closeText`. Defaults to `"close"`. |
| closeText | `string` | "Close" |  | Accessible name of the close icon, and the label of the fallback close button. |
| describedBy | `string` |  |  | The `nativeID` of the element that describes the dialog (an alert's message), set as `aria-describedby`. Only used with `role`. |
| disableBackdropClick | `boolean` | false |  | Keeps a click on the backdrop from calling `onClose`. Defaults to `false`. |
| disableEscapeKeyDown | `boolean` | false |  | Keeps Escape (web) and Android back from calling `onClose`. Turn it on for a decision the user must not be able to skip. Defaults to `false`. |
| form | `boolean` | false |  | Wraps the body and the `actions` in a `Form`, so a `Button type="submit"` in `actions` (or Enter in a field, on the web) calls `onSubmit`. In a `fullScreen` dialog the header is inside it too. |
| fullScreen | `boolean` | false |  | The M3 full-screen dialog, for a form on a compact window: it fills the window, with a close button, the title and `actions` in a header row and a scrolling body. Defaults to `false`. |
| height | `number \| `${number}%`` |  |  | A fixed height for the dialog card, in px or as a percentage of the window (`"60%"`). The body scrolls when the content is taller. The card never grows past 90% of the window. Ignored by `fullScreen`. |
| icon | `IconSource` |  |  | Hero glyph above the title (M3 dialog icon). Centres the header. |
| initialFocus | `"auto" \| "actions"` | "auto" |  | Web: where focus goes once the dialog is open. `"auto"` leaves it to the modal's focus trap, which takes the first focusable element (the close icon, or a field in the body). `"actions"` focuses the first control of the `actions` row, so an alert starts on its least destructive button. Ignored by `fullScreen`. Defaults to `"auto"`. |
| onClose | `() => void` |  |  | Asks the dialog to close: called by the close icon, a click on the backdrop, Escape (web) and Android back. Without it the dialog has no way to close itself, so `visible` stays up to the app. |
| onSubmit | `() => void` |  |  | Called when the `form` is submitted. Only used with `form`. |
| role | `"dialog" \| "alertdialog"` |  |  | The ARIA role of the card, for the web and for screen readers elsewhere. `"alertdialog"` marks a dialog that interrupts to ask for an answer (see `AlertDialog`); the title then names the card. Left out, the card has no role of its own and react-native-web's modal supplies `dialog`. |
| scrollable | `boolean` | false |  | Scrolls the body when the content is taller than the dialog. |
| slotStyles | `DialogSlotStyles` |  |  | Style overrides for the parts of the dialog, merged after its own styles. |
| testID | `string` | "dialog" |  | Root testID. The scrim gets `${testID}-scrim`, the close icon `${testID}-close`, the form `${testID}-form`. |
| title | `string` |  |  |  |
| transparent | `boolean` | true |  |  |
| width | `DialogWidth` | "md" |  | How wide the dialog may grow on a wide window: `"xs"` 360, `"sm"` 480, `"md"` 560, `"lg"` 800. Defaults to `"md"`. Ignored by `fullScreen`. |

### Download

`packages/ui/src/components/Download.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children | `\| React.ReactNode \| ((state: { download: () => Promise<boolean>; downloading: boolean; }) => React.ReactNode)` |  |  | The button's label, `"Download"` if left out. A function draws your own trigger instead of the button: it gets `{ download, downloading }`, `download` saving this file, and is drawn as returned. |
| color | `ColorRole` | "primary" |  | The button's colour role. Defaults to `"primary"`. |
| data | `string \| object \| Blob` |  |  | The content: a string (saved as text), an object (saved as JSON) or a `Blob` (any binary file). Wins over `url` when both are given. |
| disabled | `boolean` |  |  |  |
| filename | `string` |  |  | The saved file's name. Defaults to the last part of `url`, else `download` (`download.json`, `download.txt` for `data`). |
| icon | `MaterialCommunityIconsGlyphs` | "download" |  | The button's icon. Defaults to `"download"`. |
| mimeType | `string` |  |  | The media type. Defaults to the one the extension of `filename` tells, else `application/json` for an object, `text/plain` for a string, the `Blob`'s own type or the response's. |
| onDownload | `(file: DownloadFile) => void` |  |  | Called with the file after it was saved. |
| onError | `(error: Error) => void` |  |  | Called when fetching or saving failed. |
| save | `DownloadSaver` |  |  | Saves the file. On web it defaults to a temporary `<a download>` link; on native to the system share sheet with the text (or the link), which is enough for text and links. Pass one to write real files (`expo-file-system` + `expo-sharing`) and for a `Blob`. |
| style | `StyleProp<ViewStyle>` |  |  | Style of the button. |
| testID | `string` |  |  |  |
| url | `string` |  |  | A file to fetch. On web it is fetched into a `Blob` first, as browsers ignore `download` on a cross-origin link. On native it is not fetched: the `save` writer gets it as `file.url` and downloads it its own way (`expo-file-system`), and without a writer it is shared as a link. |
| variant | `ButtonVariant` | "filled" |  | The button's variant. Defaults to `"filled"`. |

### Drawer

`packages/ui/src/components/Drawer.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  | `DrawerSection`s and/or `DrawerItem`s, or any content when the drawer is a side sheet (a form, filters, details). |
| actions | `React.ReactNode` |  |  | A row of buttons at the bottom, below a divider. |
| collapsed | `boolean` | false |  | Icons only, 72 wide: labels, badges, titles and sub-items are hidden (an item without an icon shows its first letter). Defaults to `false`. |
| elevation | `number` |  |  | The level of the surface, 0 to 5: the tone it is painted in and, on iOS and Android, its shadow. Defaults to `0` when static and `1` when swipeable. |
| footer | `React.ReactNode` |  |  | Pinned below the scrolling items. |
| header | `React.ReactNode` |  |  | Pinned above the scrolling items: a logo, a site picker. |
| height | `number` | DRAWER_HEIGHT |  | Top and bottom: the largest height, defaults to 360. |
| onBack | `() => void` |  |  | Shows a back button before the title, for a drawer with sub-pages. |
| onClose | `() => void` |  |  | Called by the close button, and by a swipeable drawer's scrim, closing drag, Android back and Escape (web). |
| position | `"left" \| "right" \| "top" \| "bottom"` | "left" |  | The window edge it is attached to: `"left"` and `"right"` are columns of `width`, `"top"` and `"bottom"` span the full width and are as tall as their content, up to `height`. The edges are physical, not mirrored in right-to-left layouts. Defaults to `"left"`. |
| showCloseButton | `boolean` | false |  | Adds a close button to the header row, which calls `onClose`. Defaults to `false`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| title | `string` |  |  | Headline at the top of the drawer. With a close button, a back button or `actions` it is the title of a header row instead, in a larger type. |
| variant | `"static" \| "swipeable"` | "static" |  | `"static"` is a permanent panel in the layout, beside the content, with no scrim. `"swipeable"` slides over the content on a scrim, and a drag toward its edge, the scrim, Android back and Escape (web) close it. Defaults to `"static"`. |
| visible | `boolean` | false |  | Swipeable only: whether the drawer is open. |
| width | `number` | DRAWER_WIDTH |  | Left and right: defaults to 360 (M3), capped at the window width when swipeable. |

### Editable

`packages/ui/src/components/Editable.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| defaultValue | `string` | "" |  | The value to start from when uncontrolled. Defaults to `""`. |
| disabled | `boolean` | false |  | Dims the text and keeps it from opening. |
| editing | `boolean` |  |  | Controls whether the field is open; pair with `onEditingChange`. |
| fullWidth | `boolean` | false |  | Fills the width of its container, in display and in edit alike. Left off, the display is as wide as its text and the open field takes exactly that width (at least 120 px), so opening it moves nothing; a textarea keeps the width and grows in height. Defaults to `false`. |
| label | `string` |  |  | The accessible name of the display button and of the open field. Not drawn. |
| onCancel | `(previous: string) => void` |  |  | Called with the value the edit started from when it is cancelled (Escape or the close button). |
| onChange | `(value: string) => void` |  |  | Called with the text on every edit while the field is open. When the edit is cancelled it is called once more with the value the edit started from. |
| onEditingChange | `(editing: boolean) => void` |  |  | Called with the new state when the edit starts, is confirmed or is cancelled. |
| onSubmit | `(value: string) => void` |  |  | Called with the value when the edit is confirmed (Enter, blur or the check button, per `submitMode`). |
| options | `Option[]` |  |  | The choices of a `type="select"`. The display shows the label of the selected one. |
| placeholder | `string` | "Edit" |  | Drawn in the muted tone when the value is empty. Defaults to `"Edit"`. |
| precision | `number` |  |  | For `type="number"`: the decimals the field keeps. |
| readOnly | `boolean` | false |  | Shows the text as plain text, with no way to open it. |
| renderDisplay | `(value: string) => React.ReactNode` |  |  | Draws the displayed value your way (a link, a badge, a formatted amount) instead of as text. |
| selectAllOnFocus | `boolean` | false |  | Selects the whole text when the field opens, to type over it. Defaults to `false`. |
| showControls | `boolean` | false |  | Shows the check and close buttons whatever the `submitMode`. With them shown, leaving the field no longer confirms it. Defaults to `false`. |
| size | `"small" \| "medium" \| "large"` | "medium" |  | The size of the text, the pencil and the open field (`"small"` is dense). Defaults to `"medium"`. |
| startWithEditView | `boolean` | false |  | Mounts with the field already open (uncontrolled). Defaults to `false`. |
| submitMode | `"blur" \| "enter" \| "both" \| "none"` | "both" |  | What confirms the edit: `"blur"` (focus leaving the field), `"enter"` (Enter), `"both"`, or `"none"`, which shows check and close buttons to confirm and cancel with. Escape cancels in every mode. Defaults to `"both"`. |
| testID | `string` |  |  | Root testID. The open field gets `${testID}-input`, the buttons `${testID}-save` and `${testID}-cancel`. |
| textVariant | `TypographyProps["variant"]` |  |  | The type-scale role of the displayed text, over what `size` picks. |
| type | `EditableType` | "text" |  | The field that opens: `"text"` is an `Input`, `"textarea"` an `InputArea` (Enter adds a line; Ctrl or Cmd + Enter confirms), `"number"` an `Input type="number"` (the value stays plain text) and `"select"` a `Select` that is already open, which confirms on the pick. Defaults to `"text"`. |
| validate | `(value: string) => string \| undefined` |  |  | Checks the value: return the message to show as the field's error, or `undefined` when it is fine. While there is an error the edit cannot be confirmed. |
| value | `string` |  |  | The value, as text (for `type="number"` too: `"12.50"`, as `Input` has it). Controlled; pair with `onChange`. |
| variant | `"outlined" \| "filled"` | "outlined" |  | The look of the open field: `"outlined"` or `"filled"`, as in `Input`. Defaults to `"outlined"`. |

### Form

`packages/ui/src/components/Form.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children | `React.ReactNode` |  |  |  |
| disabled | `boolean` | false |  | Disables every `FormField` and the form's submit buttons. |
| form | `FormInstance` |  |  | The instance from `useForm()`, to read and drive the form from outside it (`form.setValue`, `form.reset()`, `useWatch("name", form)`). Without it the form keeps its own, reachable from inside through the hooks. |
| initialValues | `FormValues` |  |  | Values the fields start from, as `{ email: "", address: { city: "" } }`. Read when the form mounts; `form.reset(values)` starts over with new ones. Give every field one (or its own `initialValue`): a field with none has the value `undefined`. |
| onSubmit | `(values: FormValues) => void` |  |  | Called with the values when the form is submitted and every field passes its rules: a `Button type="submit"` inside it is pressed, or (on the web) Enter is pressed in one of its fields. It may be async: the form's `isSubmitting` (and a submit `Button`'s `loading`) stay true until it settles, and a second submission is ignored meanwhile. A form of parent-held state, with no `FormField`, calls it too (with `{}`). |
| onSubmitFailed | `(errors: FormErrors, values: FormValues) => void` |  |  | Called instead of `onSubmit` when a field fails its rules, with the messages by field name and the values. |
| onValuesChange | `(changed: FormValues, all: FormValues) => void` |  |  | Called after a field's value changes (a user edit, `setValue`, `setValues`; not `reset`) with just what changed, nested like the values (`{ address: { city: "Rome" } }`), and with all of them. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| validateOn | `FormValidateOn` | "change" |  | When a field is validated: `"change"` after every edit, `"blur"` when it is left, `"submit"` only on submit. After a submit, or once a field shows an error, an edit validates it again whatever the mode, so a fixed field clears at once. A `FormField` can override it. Defaults to `"change"`. |

### FormField

`packages/ui/src/components/FormField.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `\| React.ReactElement \| ((field: FormFieldChildProps<V, T, C>) => React.ReactNode)` |  |  | The one control to connect, which receives the value, the trigger, `onBlur`, `error`, `required` and `disabled` as props. Or a function that gets those props and returns the control, for a control whose required props (`Input` needs `value` and `onChange`) you would otherwise have to write out: `{(field) => <Input label="Email" {...field} />}`. |
| name * | `string` |  |  | The field's name in the form's values: `"email"`, `"address.city"`, `"items[0].qty"` (dots and brackets both nest). |
| control | `C` | false as C |  | For a child that draws no label, helper or error text of its own (`Checkbox`, `Switch`, `Slider`, `RadioGroup`): wraps it in a `FormControl` that does, and passes it `error` as a boolean (and no `required`, `label` or `helperText`: `FormControl` draws those). Defaults to `false`. |
| dependencies | `string[]` |  |  | Names of other fields this one's rules read (`"password"` for a "confirm password"): it is validated again when one changes, once it has been touched or edited, or shows an error. |
| disabled | `boolean` | false |  | Disables this field (the child's `disabled`); the form's `disabled` does it for all. |
| getValueFromEvent | `(...args: any[]) => unknown` |  |  | Turns what the trigger is called with into the value to store. By default the first argument, or, when that is a DOM event, its `target.value` (`target.checked` for `valuePropName="checked"`). |
| helperText | `string` |  |  | Supporting text, passed to the child as `helperText` (or drawn by `FormControl` with `control`). Hidden while there is an error. |
| initialValue | `unknown` |  |  | The value the field starts with when the form's `initialValues` has none for it. |
| label | `string` |  |  | Label, passed to the child as its `label` (`Input`, `Select`... draw it). With `control`, drawn above the child by `FormControl` instead. |
| normalize | `(value: any, previous: any, values: FormValues) => unknown` |  |  | Turns the reported value into the stored one: `(value, previous, allValues) => stored`. Trim, uppercase, format. |
| rules | `FormRule[]` |  |  | What the value must satisfy, checked in order; the first failure is the field's `error`. |
| trigger | `T` | "onChange" as T |  | The child's callback that reports a new value. `"onValueChange"` for a `Checkbox` or a `Slider`. Defaults to `"onChange"`. |
| validateOn | `FormValidateOn` |  |  | Overrides the form's `validateOn` for this field: a `Checkbox` has no blur, so `"change"` suits it. |
| valuePropName | `V` | "value" as V |  | The child's prop that takes the value. `"checked"` for a `Checkbox`. Defaults to `"value"`. |

### HighlightedCode

`packages/ui/src/components/CodeBlock.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| code * | `string` |  |  | The source to colour. |
| decorative | `boolean` |  |  | Hides the text from assistive technology, for a copy that only decorates (a field's own text is read instead). |
| language | `CodeLanguage` | "tsx" |  | What the source is written in. Defaults to `"tsx"`. |
| selectable | `boolean` |  |  | Lets the reader select the text. |
| style | `StyleProp<TextStyle>` |  |  | Merged after the code type: padding, font size. |
| testID | `string` |  |  |  |

### HoverCard

`packages/ui/src/components/HoverCard.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  | The trigger. It is not wrapped in an accessible element of its own. |
| content * | `React.ReactNode` |  |  | What the card shows: any node. It is supplementary, never the only way to something. |
| anchorPosition | `AnchorPosition` |  |  | Places the card as `Popover` does (below, above or over the trigger, aligned by its left edge, right edge or centre) instead of by `placement`, which it replaces when given. |
| closeDelay | `number` | 150 |  | Web: how long after the pointer leaves the trigger and the card before it closes, in ms. Defaults to `150`. |
| defaultOpen | `boolean` | false |  | Whether the card starts open (uncontrolled). Defaults to `false`. |
| disabled | `boolean` | false |  | The card never opens, and closes if it was open. |
| onOpenChange | `(open: boolean) => void` |  |  | Called with the new state when the user opens or closes the card. |
| open | `boolean` |  |  | Controls whether the card is open; pair with `onOpenChange`. |
| openDelay | `number` | 300 |  | Web: how long the pointer or focus rests on the trigger before the card opens, in ms. Defaults to `300`. |
| placement | `PlacementSide` | "bottom" |  | The side of the trigger the card opens on, centred on it. When that side has no room the card goes to the opposite one, and it always stays inside the window. Defaults to `"bottom"`. |
| style | `StyleProp<ViewStyle>` |  |  | Style of the trigger's wrapper, which shrinks to the trigger by default. |
| testID | `string` |  |  | Root testID. The card gets `${testID}-card`, the native outside-press layer `${testID}-backdrop`. |
| width | `number` | 280 |  | Width of the card in px; it never grows past the window. Defaults to `280`. |

### IFrame

`packages/ui/src/components/IFrame.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| src * | `string` |  |  | The address of the page to embed. |
| title * | `string` |  |  | The frame's accessible name: what the embedded page is. Required, as a frame without one is announced as nothing. |
| allow | `string` |  |  | The `allow` attribute: the features the page may use (`"fullscreen; clipboard-write"`). |
| fallback | `React.ReactNode` |  |  | Drawn on iOS and Android instead of the page. Defaults to an icon and a short notice. |
| height | `DimensionValue` | 300 |  | Defaults to 300. |
| loading | `"lazy" \| "eager"` | "lazy" |  | `"lazy"` loads the page when the frame comes near the viewport. Defaults to `"lazy"`. |
| onError | `() => void` |  |  | Called when the frame reports an error loading. Browsers rarely do for a page that fails to load. |
| onLoad | `() => void` |  |  | Called when the page has loaded. |
| referrerPolicy | `React.IframeHTMLAttributes<HTMLIFrameElement>["referrerPolicy"]` |  |  | The `referrerpolicy` attribute. |
| sandbox | `string` |  |  | The `sandbox` attribute. `""` applies every restriction; a list of tokens (`"allow-scripts allow-same-origin"`) lifts the ones named. Left out, the page is not sandboxed. |
| style | `StyleProp<ViewStyle>` |  |  | Style of the box the frame fills: radius, border, margin, flex. |
| testID | `string` |  |  |  |
| width | `DimensionValue` | "100%" |  | Defaults to the full width of the parent. |

### InputArea

`packages/ui/src/components/InputArea.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(text: string) => void` |  |  | Called with the new text on every edit. |
| value * | `string` |  |  |  |
| density | `Density` |  |  | Control density: `"dense"` is 14 px text and less padding, for desktop forms. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| fullWidth | `boolean` | true |  | Stretches the field to its container's width. `false` shrinks it to its content, with a minimum width. Defaults to `true`. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputProps | `InputTextInputProps` |  |  | Hints, focus and key handling for the underlying `TextInput`, as `Input`'s `inputProps`. |
| inputRef | `React.Ref<TextInput>` |  |  | A ref to the underlying `TextInput`, to focus it or select its text. |
| label | `string` |  |  |  |
| labelPlacement | `"inside" \| "outside"` |  |  | Where the label is drawn: `"outside"` above the box, or `"inside"`, small, above the text within it. Independent of `variant`. Defaults to `"outside"`. |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| maxLength | `number` |  |  |  |
| maxRows | `number` |  |  | Without `rows`: the most lines the field grows to; past that its text scrolls. Without it a field with `minRows` grows without limit. A value under `minRows` is raised to it. |
| minRows | `number` |  |  | Without `rows`: the field starts this many lines tall and grows with its text (up to `maxRows`, if given). Defaults to 1 when only `maxRows` is given. |
| onBlur | `() => void` |  |  | Called when the field loses focus. |
| onFocus | `() => void` |  |  | Called when the field gains focus. |
| onTrailingIconPress | `() => void` |  |  | Pressing `trailingIcon`. It is a bare, unlabelled icon. |
| placeholder | `string` |  |  |  |
| readonly | `boolean` |  |  |  |
| required | `boolean` |  |  | Marks the label with an asterisk. |
| reserveHelperText | `boolean` | false |  | Keeps the line under the field even with no helper or error text, so a message appearing does not push the next field down. Default false. |
| rows | `number` |  |  | Visible lines of a field of fixed height: it is exactly that tall and its text scrolls inside. Wins over `minRows` and `maxRows`. With none of the three given the field is 4 lines. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| trailingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| variant | `"outlined" \| "filled"` | "outlined" |  | The look of the box: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box that shows its border only while focused or in error. Defaults to `"outlined"`. |

### NavBar

`packages/ui/src/components/NavBar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeId * | `string` |  |  | `id` of the current destination. |
| items * | `NavBarItem[]` |  |  | Destinations, three to five per M3. |
| onClick * | `(id: string) => void` |  |  | Called with the `id` of the pressed destination. |
| showLabels | `"always" \| "selected"` | "always" |  | "always" shows every label, "selected" only the active one. |

### NumberField

`packages/ui/src/components/NumberField.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(val: number) => void` |  |  |  |
| value * | `number` |  |  |  |
| disabled | `boolean` |  |  |  |
| label | `string` |  |  |  |
| max | `number` |  |  | No upper limit when unset. |
| min | `number` |  |  | No lower limit when unset. |
| step | `number` | 1 |  | How much the buttons add or take away. A fraction (`0.5`) is fine. |

### PasswordField

`packages/ui/src/components/PasswordField.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(text: string) => void` |  |  | Called with the new text on every edit (for `type="number"`, already cleaned). |
| value * | `string` |  |  |  |
| autoComplete | `"current-password" \| "new-password"` | "current-password" |  | What the platform's password manager should do: fill the saved password (`"current-password"`) or offer to generate and save a new one (`"new-password"`). Defaults to `"current-password"`. |
| defaultVisible | `boolean` | false |  | Whether the text starts revealed (uncontrolled). Defaults to `false`. |
| density | `Density` |  |  | Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 56, 14 px text, less space below. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| fullWidth | `boolean` | true |  | Stretches the field to its container's width. `false` shrinks it to its content, with a minimum width so an empty field stays usable. Defaults to `true`. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputProps | `InputTextInputProps` |  |  | Autofill and keyboard hints, focus and key handling for the underlying `TextInput`: `autoComplete`, `textContentType`, `autoCorrect`, `autoCapitalize`, `spellCheck`, `autoFocus`, `selectTextOnFocus`, `returnKeyType`, `enterKeyHint`, `onSubmitEditing`, `onKeyPress`, `accessibilityLabel` / `accessibilityValue` (replace the ones drawn from `label` and `value`) and `testID`. |
| inputRef | `React.Ref<TextInput>` |  |  | A ref to the underlying `TextInput`, to focus it or select its text. |
| label | `string` |  |  |  |
| labelPlacement | `"inside" \| "outside"` |  |  | Where the label is drawn: `"outside"` above the box, or `"inside"`, small, above the text within it. Independent of `variant`. Defaults to `"outside"`. |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| maxLength | `number` |  |  |  |
| minHeight | `number` |  |  | Overrides the height `density` gives (56, or 40 when dense). |
| onBlur | `() => void` |  |  | Called when the field loses focus. |
| onFocus | `() => void` |  |  | Called when the field gains focus. |
| onVisibleChange | `(visible: boolean) => void` |  |  | Called with the new state when the eye button is pressed. |
| placeholder | `string` |  |  |  |
| prefix | `string` |  |  |  |
| readonly | `boolean` |  |  |  |
| required | `boolean` |  |  | Marks the label with an asterisk. |
| reserveHelperText | `boolean` |  |  | Keeps the line under the field even with no helper or error text, so a message appearing does not push the next field down. Default false. |
| showStrength | `boolean` | false |  | Draws a strength meter under the field once something is typed, scored by `passwordStrength`. For a field that creates a password, not one that enters it. Defaults to `false`. |
| showToggle | `boolean` | true |  | Shows the eye button at the end of the field that reveals and hides the text. Turn it off for a field that must never be revealed. Defaults to `true`. |
| strengthLabels | `readonly string[]` | DEFAULT_LABELS |  | The words of the meter, from very weak (index 0) to strong (index 4). Defaults to `["Very weak", "Weak", "Fair", "Good", "Strong"]`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| suffix | `string` |  |  |  |
| toggleLabels | `{ show?: string; hide?: string }` |  |  | The accessible names of the eye button. Default `Show password` / `Hide password`. |
| variant | `"outlined" \| "filled"` |  |  | The look of the box: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box (like `PinInput`'s) that shows its border only while focused or in error. Where the label sits is `labelPlacement`'s business, not the variant's. Defaults to `"outlined"`. |
| visible | `boolean` |  |  | Controls whether the text is revealed; pair with `onVisibleChange`. |

### QrCode

`packages/ui/src/components/QrCode.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| value * | `string` |  |  | What the code says: a URL, a Wi-Fi string, a vCard, any text. Encoded as UTF-8, in the narrowest of the numeric, alphanumeric and byte modes. The most a code holds is 2953 bytes at level `"L"`; past that nothing is drawn and `onError` is called. |
| accessibilityLabel | `string` | "QR code" |  | What a screen reader says about the code. The value is not read out by default (it may be a secret). Defaults to `"QR code"`. |
| backgroundColor | `ThemeColor` |  |  | The background, a theme colour token or any colour string. See `color` for the default. |
| color | `ThemeColor` |  |  | The modules: a theme colour token or any colour string. Scanners read dark modules on a light background, so the default does not follow the theme's mode: `onSurface` on `surface` in a light theme, `inverseOnSurface` on `inverseSurface` (still dark on light) in a dark one. |
| level | `QrLevel` | "M" |  | How much damage the code survives, and so how big it grows: `"L"` about 7% of it can be lost, `"M"` 15%, `"Q"` 25%, `"H"` 30%. A `logo` raises it to `"H"` whatever this says. Defaults to `"M"`. |
| logo | `MaterialCommunityIconsGlyphs \| Exclude<React.ReactNode, string>` |  |  | A mark drawn over the middle of the code: a glyph name, or any node (an `Image`), centred in a box a fifth of the code wide. The modules under it are lost, so the level is raised to `"H"`. |
| onError | `(error: Error) => void` |  |  | Called with the error when `value` does not fit in a code, which is then drawn empty. |
| quietZone | `number` | 4 |  | The empty margin around the modules, in modules. Scanners need it to find the code; the standard asks for 4. Defaults to 4. |
| size | `number` | 160 |  | Side of the whole code, quiet zone included, in px. Defaults to 160. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### ScrollArea

`packages/ui/src/components/ScrollArea.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children | `React.ReactNode` |  |  |  |
| contentContainerStyle | `StyleProp<ViewStyle>` |  |  | Style of the view wrapping the children inside the scroll view (padding, `flexGrow`). |
| height | `DimensionValue` |  |  | Fixed height of the area. Leave it out to size to the content, up to `maxHeight`. |
| maxHeight | `DimensionValue` |  |  | The height at which the content starts to scroll. |
| onScroll | `(event: NativeSyntheticEvent<NativeScrollEvent>) => void` |  |  | Called on every scroll, like `ScrollView`'s. With `orientation="both"` the event carries both axes' offset, content size and layout measurement. |
| orientation | `"vertical" \| "horizontal" \| "both"` | "vertical" |  | The axis that scrolls. `"both"` nests a horizontal scroll view in a vertical one, so the content may overflow in either direction. Defaults to `"vertical"`. |
| ref | `React.Ref<ScrollView>` |  |  | A ref to the scroll view: the vertical one, or the horizontal one for `orientation="horizontal"`. Use it for `scrollTo`, `scrollToEnd`, … |
| scrollbarSize | `number` | 10 |  | Thickness of the scrollbar, in dp: raise it on touch screens for a bigger grab area. Defaults to `10`. |
| scrollHideDelay | `number` | 600 |  | How long, in ms, a `scroll` or `hover` scrollbar stays after the last scroll, drag or hover. Defaults to `600`. |
| slotStyles | `ScrollAreaSlotStyles` |  |  | Style overrides for the track and the thumb. |
| style | `StyleProp<ViewStyle>` |  |  | Style of the outer view. The scrollbars are laid over it. |
| testID | `string` |  |  | Root testID. The scroll view gets `${testID}-viewport` (the horizontal one of `both`, `${testID}-viewport-x`), each scrollbar `${testID}-scrollbar-vertical` or `${testID}-scrollbar-horizontal`, and its thumb `${testID}-thumb-vertical` or `${testID}-thumb-horizontal`. |
| type | `"auto" \| "always" \| "scroll" \| "hover"` | "auto" |  | When the scrollbars are visible. - `auto`: whenever the content overflows. - `always`: always, overflowing or not. - `scroll`: while scrolling or dragging, and `scrollHideDelay` after. - `hover`: while the pointer is over the area (web), and while scrolling or dragging. Without a pointer, as on a phone, it behaves like `scroll`. Defaults to `"auto"`. |
| width | `DimensionValue` |  |  | Fixed width of the area. |

### Switch

`packages/ui/src/components/Switch.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(value: boolean) => void` |  |  | Called with the new state when the switch, or its label, is pressed. |
| value * | `boolean` |  |  |  |
| containerStyle | `StyleProp<ViewStyle>` | {} |  | Style for the outer Pressable. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report the switch to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| height | `number` | SIZES[size].height |  | Track height; the thumb scales with it. Defaults to the `size`'s (18 for medium). |
| label | `string` |  |  | Text next to the switch. Pressing it toggles the switch too. |
| labelPlacement | `"start" \| "end" \| "top" \| "bottom"` | "end" |  | Where the label sits relative to the switch: `"start"` and `"end"` are the left and right in a left-to-right layout, `"top"` and `"bottom"` stack them. Defaults to `"end"`. |
| size | `"small" \| "medium" \| "large"` | "medium" |  | Switch size: `"small"` is 24 x 14, `"medium"` 32 x 18, `"large"` 40 x 22. `width` and `height` override it. Defaults to `"medium"`. |
| width | `number` | SIZES[size].width |  | Track width. Defaults to the `size`'s (32 for medium). |

### Tree

`packages/ui/src/components/Tree.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| data * | `TreeNode[]` |  |  | The roots. Keep the array (and the nodes in it) stable between renders: rows whose node did not change are not drawn again. |
| accessibilityLabel | `string` |  |  | Names the tree for assistive tech. |
| checkboxes | `boolean` | false |  | With `selectionMode="multiple"`, a checkbox on each row: checking a parent checks everything under it, and a parent with only some children checked shows the mixed state. Ignored in the other modes. Defaults to `false`. |
| defaultExpanded | `string[]` | [] |  | The ids of the nodes that start open, when `expanded` is not set. |
| defaultSelected | `string[]` | [] |  | The ids that start selected, when `selected` is not set. |
| disabled | `boolean` | false |  | Nothing can be opened, selected or focused. Defaults to `false`. |
| expanded | `string[]` |  |  | The ids of the open nodes. Set, the tree is controlled: it opens and closes what this says, and reports through `onExpandedChange`. |
| indent | `number` | 24 |  | How far each level is pushed in, in px. Defaults to 24. |
| loadChildren | `(node: TreeNode) => Promise<TreeNode[]>` |  |  | Fetches the children of a node marked `hasChildren` when it is first opened; a loading row shows meanwhile, and a retry row if the promise rejects. The result is kept: the node is not asked again. |
| loadingText | `string` | "Loading…" |  | The text of the loading row. Defaults to `"Loading…"`. |
| onExpandedChange | `(expanded: string[]) => void` |  |  | Called with the open ids after a node is opened or closed. |
| onLoadError | `(error: unknown, node: TreeNode) => void` |  |  | Called when `loadChildren` rejects. |
| onSelectedChange | `(selected: string[]) => void` |  |  | Called with the selected ids after a press, a Space or an Enter on a row. |
| renderLabel | `(node: TreeNode, state: TreeRowState) => React.ReactNode` |  |  | Draws the label of a row instead of `node.label`. Rows are memoised: pass a function that does not change between renders (`useCallback`), or every row is drawn again whenever the tree is. |
| retryText | `string` | "Could not load. Try again" |  | The text of the row that retries a failed load. Defaults to `"Could not load. Try again"`. |
| selected | `string[]` |  |  | The ids of the selected nodes: at most one with `selectionMode="single"`. With checkboxes it lists every checked node, a parent whose children are all checked included. Set, the tree is controlled. |
| selectionMode | `"none" \| "single" \| "multiple"` | "none" |  | What pressing a row does. `"none"` opens and closes it, `"single"` selects it (and only it), `"multiple"` toggles it in the selection. The chevron always opens and closes. Defaults to `"none"`. |
| showLines | `boolean` | false |  | Draws a vertical guide line down each open node's children. Defaults to `false`. |
| size | `"small" \| "medium" \| "large"` | "medium" |  | Row height and text size: 32, 40 or 48 px. Defaults to `"medium"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Upload

`packages/ui/src/components/Upload.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accept | `string` |  |  | What may be picked, written like the `accept` of an `<input type="file">`: `"image/*,.pdf"`. It filters the web file dialog and is checked on every file added, on every platform (a drop, or what `onPick` returns). |
| defaultValue | `UploadFile[]` |  |  | The files the list starts with, when it is not controlled. |
| disabled | `boolean` | false |  |  |
| error | `string` |  |  | An error message under the field, in the error colour. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| label | `string` |  |  | A label above the field. |
| maxFiles | `number` |  |  | How many files the list may hold with `multiple`: the ones past it are rejected. |
| maxSize | `number` |  |  | The largest file, in bytes: a bigger one is rejected. |
| multiple | `boolean` | false |  | Allows several files. Without it a new file replaces the one in the list. Defaults to `false`. |
| onChange | `(files: UploadFile[]) => void` |  |  | Called with the whole list whenever it changes: files added or removed, a status or a progress moved. |
| onPick | `() => Promise<PickedFile[]>` |  |  | Opens a picker and resolves the files chosen (an empty list for none): the app wires `@its/glowup-device/media-picker` or a document picker here. The library imports no picker. On native it is required for the field to be drawn; on web it replaces the browser's file dialog when given. |
| onReject | `(rejections: UploadRejection[]) => void` |  |  | Called with the files that were not added (too large, wrong type, past `maxFiles`). Without it the reasons are shown under the field. |
| onUpload | `(file: UploadFile, handlers: UploadHandlers) => Promise<void>` |  |  | Uploads each new file. Return a promise that resolves when it is done and rejects when it failed; report `onProgress` as it goes and stop on `signal`. The file is listed as `"uploading"` with its progress, then `"done"`, or `"error"` with a retry button. Without it files are only collected (`"pending"`), for you to send with a form. |
| prompt | `string` |  |  | What the dropzone or the button says. Defaults to "Drag files here or click to browse" in a web dropzone, else "Choose files" ("Choose a file" without `multiple`). |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| value | `UploadFile[]` |  |  | The files in the list. Give it with `onChange` to control the list. |
| variant | `"dropzone" \| "button"` | "dropzone" |  | `"dropzone"` is a dashed area to drop files on or press; `"button"` is a plain button (a drop on it still works on web). Defaults to `"dropzone"`. |

### ViewportProvider

`packages/ui/src/providers/Viewport.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| width | `number` |  |  | The width, in dp, to report instead of the window's. Leave it out (or `undefined`) and the real window width is reported, so the provider can sit in place permanently and be switched on by a value. |

### Visible

`packages/ui/src/components/Visible.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| above | `SizeClass` |  |  | Shows from this window size class up (`"medium"` is medium, expanded, large, …). |
| below | `SizeClass` |  |  | Shows only on size classes smaller than this one (`"medium"` is compact only). |
| children | `React.ReactNode` |  |  |  |
| fallback | `React.ReactNode` |  |  | Rendered in place of the children while they are not shown. |
| keepMounted | `boolean` | false |  | Hides the children with `display: "none"` instead of unmounting them, so their state survives. They are then wrapped in a `View` (laid out as if it were not there while they show). Defaults to `false`. |
| only | `SizeClass \| SizeClass[]` |  |  | Shows only on this size class, or on any of these. |
| when | `boolean` | true |  | A condition of your own; the children show only while it holds. Defaults to `true`. |

# Componenti aggiornati

### Accordion

`packages/ui/src/components/Accordion.tsx` — prop nuove: `expanded`, `icon`, `onClick`, `variant`; prop tolte: `onPress`, `startExpanded`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| title * | `string` |  |  |  |
| expanded | `boolean` | false | nuova | Whether the panel is open. The accordion keeps its own open state: it starts from this value, a press on the header toggles it, and it follows the prop again whenever the prop changes. So it works as an initial state (`expanded` alone) and as a controlled value (a parent that sets `expanded` from `onClick`). Defaults to `false`. |
| icon | `MaterialCommunityIconsGlyphs \| Exclude<React.ReactNode, string>` |  | nuova | The icon at the end of the header: a glyph name, or any node. It is drawn as given; the default, a chevron, turns upside down while the panel is open. |
| onClick | `(expanded: boolean) => void` |  | nuova | Called on every press of the header with the new state: `true` when it opens, `false` when it closes. |
| style | `StyleProp<ViewStyle>` | {} |  |  |
| titleStyle | `StyleProp<TextStyle>` | {} |  |  |
| variant | `"outlined" \| "contained"` | "outlined" | nuova | `"outlined"` is a bordered panel on the surface, `"contained"` a filled tonal one without a border. Defaults to `"outlined"`. |

### AppBar

`packages/ui/src/components/AppBar.tsx` — prop nuove: `actions`, `divider`, `elevated`, `leading`, `paper`, `safeArea`, `style`, `subtitle`, `testID`, `title`, `variant`; prop cambiate: `navigation`, `options`, `route`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| actions | `React.ReactNode` |  | nuova | After the title: up to three action `IconButton`s per M3. Under a navigator it defaults to `options.headerRight()`. |
| back | `{ title?: string; href?: string } \| boolean` |  |  | Truthy when a back destination exists (native-stack passes `{ title, href }`). |
| divider | `boolean` |  | nuova | A hairline under the bar. Left out, it is drawn on the web when the bar sits under a navigator and not otherwise. |
| elevated | `boolean` | false | nuova | The on-scroll state: `surfaceContainer` instead of `surface`. |
| isPinned | `boolean` | false |  | A pinned (always visible) drawer needs no menu button. |
| leading | `React.ReactNode` |  | nuova | Before the title: typically a back or menu `IconButton`. Under a navigator it defaults to a back button, or a menu button for a drawer. |
| navigation | `any` |  | cambiata | react-navigation's header contract, for a bar passed as a navigator's `header`: `navigation.goBack` and `navigation.openDrawer` feed the leading button. Structural, so any navigator's object fits; the library never imports react-navigation. |
| options | `any` |  | cambiata | The screen's navigator options: `headerTitle` or `title` give the title, `headerRight` the actions, and `headerLeft: null` or `hideMenuIcon` hides the drawer's menu button. |
| paper | `Omit<PaperProps, "children">` |  | nuova | Props of the `Paper` the bar is drawn on (`elevation`, `outline`, `glow`, `style`), merged over the bar's own: `elevation` is `0`, or `2` when `elevated`. `<AppBar paper={{ elevation: 3 }} />` lifts the bar to level 3. |
| route | `any` |  | cambiata | The navigator's route: its `name` is the title when nothing else is. |
| safeArea | `boolean` | true | nuova | Pads the top safe-area inset. Defaults to `true`. |
| style | `StyleProp<ViewStyle>` |  | nuova |  |
| subtitle | `string` |  | nuova | A second line under the title. |
| testID | `string` |  | nuova |  |
| title | `React.ReactNode` |  | nuova | The headline. A string is drawn in the variant's type style; any other node is placed as is. Left out, it is read from `options` and `route` (see `navigation`). |
| variant | `"small" \| "center" \| "medium" \| "large"` | "small" | nuova | `"small"` and `"center"` keep the title in the 64dp row; `"medium"` and `"large"` move it to a second, larger line. Defaults to `"small"`. |

### AspectRatio

`packages/ui/src/components/Layout/AspectRatio.tsx` — prop nuove: `align`, `background`, `borderColor`, `borderWidth`, `children`, `gap`, `justify`, `margin`, `padding`, `radius`, `style`, `variant`, `width`, `wrap`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  | nuova |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  | nuova | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  | nuova |  |
| children | `React.ReactNode` |  | nuova |  |
| gap | `number` |  | nuova | Gap between children, in px. |
| justify | `ViewStyle["justifyContent"]` |  | nuova |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  | nuova | Corner radius — a shape token name or a raw radius. |
| ratio | `number` | 1 |  | Width divided by height — `16 / 9`, `1`, `4 / 3`. Defaults to `1`. |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| variant | `\| "standard" \| "flex" \| "column-flex" \| "centered-flex" \| "centered-column-flex" \| "full-page-flex" \| "full-page-column-flex" \| "full-size-flex" \| "full-size-column" \| "full-size-centered-flex" \| "full-size-centered-column-flex"` |  | nuova | Layout preset: direction, centring and filling the parent. The other props and `style` are applied on top of it. - `standard`: a plain column (default). - `flex`: a row. - `column-flex`: a column. - `centered-flex`: a row, centred on both axes. - `centered-column-flex`: a column, centred on both axes. - `full-page-flex`: a row that fills the screen (`flex: 1`, minimum height 100%). - `full-page-column-flex`: the same, as a column. - `full-size-flex`: a row, 100% wide and 100% high. - `full-size-column`: a column, 100% wide and 100% high. - `full-size-centered-flex`: a row, 100% x 100%, centred on both axes. - `full-size-centered-column-flex`: a column, 100% x 100%, centred on both axes. |
| width | `ViewStyle["width"]` | "100%" | nuova |  |
| wrap | `boolean` |  | nuova | Lets children flow onto the next line (or column) instead of overflowing. |

### Autocomplete

`packages/ui/src/components/Autocomplete.tsx` — comportamento: `onSearch` toglie il filtro per etichetta; `allowCustomValue={false}` ripristina o svuota all'uscita dal campo; prop nuove: `onChange`, `allowCustomValue`, `debounce`, `defaultOptions`, `fullWidth`, `labelPlacement`, `multiple`, `onSearch`, `onSelectedChange`, `selected`, `variant`; prop cambiate: `filter`; prop tolte: `onChangeText`, `onSelect`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(text: string) => void` |  | nuova | Called with the text as it changes: typed, cleared, or filled in by a picked option (its label; empty after a pick with `multiple`). |
| options * | `AutocompleteOption[]` |  |  |  |
| value * | `string` |  |  | The text in the field. Free text is allowed — this is not a Select. |
| allowCustomValue | `boolean` | true | nuova | Whether text that is not an option may stay in the field. Defaults to `true`. With `false`, leaving the field puts back the chosen option's label, or empties it when nothing is chosen (always empties it with `multiple`, where the text is only a query). |
| clearable | `boolean` | true |  | Adds a clear button once there is text. Defaults to `true`. |
| clearAccessibilityLabel | `string` |  |  |  |
| debounce | `number` | 300 | nuova | Quiet time in ms before `onSearch`. Defaults to 300. |
| defaultOptions | `AutocompleteOption[]` |  | nuova | The suggestions offered while the field has fewer than `minChars` characters — before the user has typed, or before a first search has returned — instead of keeping the list closed. They are shown as given, not filtered. From `minChars` on, the list is `options`. Leave out for no list until the user types. |
| disabled | `boolean` |  |  |  |
| emptyMessage | `string` |  |  | Shown when nothing matches. Omit to hide the list instead. |
| error | `string` |  |  |  |
| filter | `(option: AutocompleteOption, query: string) => boolean` |  | cambiata | Custom matcher. Defaults to a case- and accent-insensitive substring test over `label`, or to no filtering at all when `onSearch` is given (the server already filtered). |
| fullWidth | `boolean` | true | nuova | Stretches the field to its container's width. `false` shrinks it to its content, with a minimum width. Defaults to `true`. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| label | `string` |  |  |  |
| labelPlacement | `"inside" \| "outside"` |  | nuova | Where the label is drawn: `"outside"` above the box, or `"inside"` within it. Independent of `variant`. Defaults to `"outside"`. |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| loading | `boolean` |  |  | Shows a spinner in the field — for options still being fetched. |
| maxSuggestions | `number` | 8 |  | Caps the visible suggestions. Defaults to 8. |
| minChars | `number` | 1 |  | Characters required before suggestions appear. Defaults to 1. |
| multiple | `false` | false | nuova | Picks one option (the default). Set to `true` to pick several. |
| onSearch | `(text: string) => void` |  | nuova | Called with the text after the user stops typing for `debounce` ms, once it has `minChars` characters, and with `""` when the field is cleared. Fetch the options there and pass them in `options`; use `loading` meanwhile. Not called for the text an option fills in. |
| onSelectedChange | `(option: AutocompleteOption \| null) => void` |  | nuova | Called on every pick with the option, and with `null` when the choice is cleared. |
| placeholder | `string` |  |  |  |
| required | `boolean` |  |  |  |
| selected | `AutocompleteOption \| null` |  | nuova | The chosen option, kept apart from the text being typed. Pass it (even as `null`) to control the choice; editing the text away from its label, or clearing the field, reports `null` through `onSelectedChange`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| variant | `"filled" \| "outlined"` | "outlined" | nuova | The look of the box: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box (like `PinInput`'s) that shows its border only while focused or in error. Where the label sits is `labelPlacement`'s business, not the variant's. Defaults to `"outlined"`. |

### Avatar

`packages/ui/src/components/Avatar.tsx` — prop nuove: `onClick`; prop cambiate: `size`; prop tolte: `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| backgroundColor | `string` |  |  |  |
| icon | `MaterialCommunityIconsGlyphs` | "account" |  |  |
| name | `string` |  |  | Initials are drawn from it when there is no `source`, and it is shown as a tooltip on hover (web) or long press (native). |
| onClick | `() => void` |  | nuova |  |
| size | `number \| "large" \| "medium" \| "small"` | "medium" | cambiata | A size in pixels, or `"small"` (32), `"medium"` (40) or `"large"` (56). Defaults to `"medium"`. |
| source | `ImageSourcePropType` |  |  |  |
| status | `"online" \| "offline" \| "busy" \| "away" \| null` |  |  |  |
| textColor | `string` |  |  |  |
| variant | `"circular" \| "rounded" \| "square"` | "circular" |  | Shape: full circle, rounded corners, or square. |

### Badge

`packages/ui/src/components/Badge.tsx` — prop nuove: `color`, `position`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| color | `ColorRole` | "error" | nuova | Colour role of the badge. Defaults to `"error"`. |
| count | `number` |  |  |  |
| max | `number` | 99 |  | Cap shown as "max+" when count exceeds it. |
| position | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` |  | nuova | The corner of the parent the badge is pinned to, overlapping it slightly. Left out, the badge is only absolutely placed and the parent (or `style`) positions it. |
| showZero | `boolean` | false |  | Render the badge even when count is 0 (hidden by default). |
| size | `"small" \| "large"` | "large" |  |  |
| style | `any` |  |  |  |
| visible | `boolean` | true |  |  |

### Banner

`packages/ui/src/components/Banner.tsx` — comportamento: i tipi `warning` e `info` usano i ruoli di stato del tema (prima il contenitore terziario/secondario: verde nelle palette di marca)

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| message * | `string` |  |  |  |
| visible * | `boolean` |  |  |  |
| actions | `BannerAction[]` |  |  | Up to two actions, rendered right-aligned below the message. |
| dismissable | `boolean` |  |  | Show a close (X) button; requires onDismiss. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| onDismiss | `() => void` |  |  |  |
| type | `BannerType` | "default" |  |  |

### BottomSheet

`packages/ui/src/components/BottomSheet.tsx` — comportamento: il contenuto scorre da solo; l'intestazione ha un ruolo `header`; prop nuove: `onClose`, `actions`, `showCloseButton`, `testID`; prop tolte: `onDismiss`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| onClose * | `() => void` |  | nuova | Called by the close button, a tap on the scrim, a drag down past the threshold and Android back. |
| visible * | `boolean` |  |  | Whether the sheet is open. |
| actions | `React.ReactNode` |  | nuova | A row of buttons fixed at the bottom, below a divider, while the content above it scrolls (named like `Dialog`'s `actions`). |
| dismissOnScrimTap | `boolean` | true |  |  |
| maxHeightRatio | `number` | 0.85 |  | Max sheet height as a fraction of the window height. |
| showCloseButton | `boolean` | false | nuova | Adds a close button at the end of the title row. Defaults to `false`. |
| showHandle | `boolean` | true |  |  |
| testID | `string` |  | nuova |  |
| title | `string` |  |  |  |

### Box

`packages/ui/src/components/Layout/Box.tsx` — prop nuove: `background`, `children`, `margin`, `padding`, `style`, `variant`; prop cambiate: `gap`; prop tolte: `bg`, `flex`, `m`, `mb`, `ml`, `mr`, `mt`, `mx`, `my`, `p`, `pb`, `pl`, `pr`, `pt`, `px`, `py`, `row`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  |  | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  |  |  |
| children | `React.ReactNode` |  | nuova |  |
| gap | `number` |  | cambiata | Gap between children, in px. |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| variant | `\| "standard" \| "flex" \| "column-flex" \| "centered-flex" \| "centered-column-flex" \| "full-page-flex" \| "full-page-column-flex" \| "full-size-flex" \| "full-size-column" \| "full-size-centered-flex" \| "full-size-centered-column-flex"` | "standard" | nuova | Layout preset: direction, centring and filling the parent. The other props and `style` are applied on top of it. - `standard`: a plain column (default). - `flex`: a row. - `column-flex`: a column. - `centered-flex`: a row, centred on both axes. - `centered-column-flex`: a column, centred on both axes. - `full-page-flex`: a row that fills the screen (`flex: 1`, minimum height 100%). - `full-page-column-flex`: the same, as a column. - `full-size-flex`: a row, 100% wide and 100% high. - `full-size-column`: a column, 100% wide and 100% high. - `full-size-centered-flex`: a row, 100% x 100%, centred on both axes. - `full-size-centered-column-flex`: a column, 100% x 100%, centred on both axes. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  | Lets children flow onto the next line (or column) instead of overflowing. |

### Button

`packages/ui/src/components/Button.tsx` — comportamento: `color="success"` legge i ruoli `success` del tema; prop nuove: `badge`, `color`, `density`, `onClick`, `type`, `variant`; prop cambiate: `iconPosition`; prop tolte: `mode`, `onPress`, `tone`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityHint | `string` |  |  |  |
| accessibilityLabel | `string` |  |  |  |
| badge | `number` |  | nuova | A count shown after the label (a `Badge`): active filters, unread items. Hidden at 0 or when left out. |
| busy | `boolean` | false |  | Blocks presses and announces the button as busy, but — unlike `loading` — keeps the label, the icon and the full-strength colours on screen. |
| children | `React.ReactNode` |  |  |  |
| color | `ButtonColor` | "primary" | nuova | Colour role. `error` is the destructive treatment (delete, discard); `success`, `warning`, `info` and `neutral` come from fixed hues kept off the seed. |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: about 36 px instead of 48. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| fullWidth | `boolean` | false |  | Stretch to fill the parent width. |
| iconName | `MaterialCommunityIconsGlyphs` |  |  |  |
| iconPosition | `"start" \| "end"` | "start" | cambiata | Icon side relative to the label. |
| iconStyle | `object` | {} |  |  |
| labelStyle | `StyleProp<TextStyle>` |  |  | Applied to the label text, after the theme's type style. |
| loading | `boolean` | false |  |  |
| onClick | `() => void` |  | nuova |  |
| size | `number` |  |  |  |
| style | `object` | {} |  |  |
| testID | `string` |  |  |  |
| type | `"button" \| "submit"` | "button" | nuova | `"submit"` submits the enclosing `Form` when pressed, after `onClick`, on every platform. While the form submits (an async `onSubmit` or validator is running) it shows `loading`, and it is `disabled` with the form. A button outside a `Form` ignores it. Defaults to `"button"`. |
| underlay | `React.ReactNode` |  |  | Drawn behind the label across the whole surface, clipped to its shape: a progress fill, a state animation. It receives no touches. |
| variant | `ButtonVariant` | "filled" | nuova |  |

### Card

`packages/ui/src/components/Card.tsx` — prop nuove: `onClick`, `selected`; prop tolte: `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| accessibilityLabel | `string` |  |  |  |
| onClick | `() => void` |  | nuova |  |
| selected | `boolean` |  | nuova | Draws the card as the chosen one of a set (a primary border) and says so to screen readers. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| variant | `"elevated" \| "filled" \| "outlined" \| "glow"` | "filled" |  |  |

### CardTitle

`packages/ui/src/components/CardParts/CardTitle.tsx` — prop nuove: `endIcon`, `startIcon`; prop tolte: `left`, `right`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| title * | `React.ReactNode` |  |  |  |
| endIcon | `React.ReactNode` |  | nuova | Trailing slot — an `IconButton`, a `Menu` anchor, a `Chip`. |
| startIcon | `React.ReactNode` |  | nuova | Leading slot — an `Avatar`, an `Icon`, a `StatusBadge`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| subtitle | `React.ReactNode` |  |  |  |
| subtitleNumberOfLines | `number` | 2 |  |  |
| titleNumberOfLines | `number` | 1 |  |  |

### Center

`packages/ui/src/components/Layout/Center.tsx` — prop nuove: `align`, `background`, `children`, `direction`, `justify`, `margin`, `padding`, `style`; prop cambiate: `gap`; prop tolte: `bg`, `flex`, `m`, `mb`, `ml`, `mr`, `mt`, `mx`, `my`, `p`, `pb`, `pl`, `pr`, `pt`, `px`, `py`, `row`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  | nuova |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  |  | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  |  |  |
| children | `React.ReactNode` |  | nuova |  |
| direction | `"row" \| "column"` | "row" | nuova | Whether the children flow in a row or in a column; either way each is centred on both axes. Defaults to `"row"`. |
| gap | `number` |  | cambiata | Gap between children, in px. |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  | nuova |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  | Lets children flow onto the next line (or column) instead of overflowing. |

### Chip

`packages/ui/src/components/Chip.tsx` — prop nuove: `border`, `color`, `onClick`, `toneFrom`, `variant`; prop cambiate: `size`; prop tolte: `mode`, `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| accessibilityRole | `"button" \| "radio" \| "checkbox"` |  |  | Overrides the role of a pressable chip (`"button"`). A chip that toggles inside a group is a `"radio"` or a `"checkbox"`, and then reports `selected` as checked. |
| border | `"rounded" \| "squared" \| "circular"` | "rounded" | nuova | Corner shape: `"rounded"` (the default), `"squared"` for square corners, `"circular"` for a pill. |
| color | `ColorRole` |  | nuova | Colour role. `filled` takes the role's accent, `tonal` its container, `outlined` draws the label and the outline in it. Left out, the chip keeps the neutral secondary look. `toneFrom` wins over it. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report presses: a `"checkbox"` chip toggles, a `"radio"` one selects to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| onClick | `() => void` |  | nuova |  |
| onClose | `() => void` |  |  |  |
| selected | `boolean` | false |  |  |
| size | `"small" \| "medium" \| "large"` | "medium" | cambiata | "small" renders a compact 24px chip, "large" a 40px one. |
| style | `object` | {} |  |  |
| toneFrom | `string` |  | nuova | Tints a `"filled"` or `"tonal"` chip from a `#RRGGBB` colour or from any text (the same text always gives the same colour), readable in light and dark. |
| variant | `"filled" \| "tonal" \| "outlined"` | "filled" | nuova |  |

### ChipGroup

`packages/ui/src/components/ChipGroup.tsx` — prop nuove: `onChange`, `multiple`, `variant`; prop tolte: `onValueChange`, `mode`, `multiSelect`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(value: any) => void` |  | nuova |  |
| options * | `ChipGroupOption[]` |  |  |  |
| value * | `string \| string[] \| null` |  |  | The selected value (or `null`), or the selected values with `multiple`. |
| accessibilityLabel | `string` |  |  | Names the group for assistive tech. |
| multiple | `boolean` | false | nuova | Filter chips: any number selected. Defaults to `false` (one at most). |
| required | `boolean` | false |  | Single select only: the selected chip cannot be deselected. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| variant | `"filled" \| "tonal" \| "outlined"` | "outlined" | nuova | Chip look. Defaults to `"outlined"`, the M3 filter chip. |
| wrap | `boolean` | true |  | `true` wraps onto more lines; `false` scrolls sideways. Defaults to `true`. |

### CircularProgress

`packages/ui/src/components/Progress/CircularProgress.tsx` — prop nuove: `label`, `labelPosition`, `trackColor`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityLabel | `string` |  |  |  |
| color | `string` |  |  | Indicator colour. Defaults to `primary`. |
| decorative | `boolean` | false |  | Hides it from assistive tech when something else announces the progress. |
| duration | `number` | 1000 |  | Indeterminate only: one revolution, in ms. |
| label | `React.ReactNode` |  | nuova | Text, a number or any node drawn with the ring, at `labelPosition`. Text is drawn in the theme's type, scaled to the ring when it is inside; a node as given. |
| labelPosition | `"top" \| "bottom" \| "left" \| "right" \| "center"` |  | nuova | Where `label` goes: `"center"` inside the ring, or `"top"`, `"bottom"`, `"left"` or `"right"` of it. Defaults to `"center"` for a ring with a `progress` and to `"right"` for a spinner, which is too small to hold a label. |
| progress | `number` |  |  | Completion from 0 to 1. Set, the ring fills to it over a track; unset, the indicator spins (indeterminate). |
| size | `number` | 48 |  |  |
| strokeWidth | `number` | 4 |  |  |
| testID | `string` |  |  |  |
| trackColor | `boolean \| string` |  | nuova | The ring under the indicator. `true` draws it in the indicator's colour at a low opacity, a string draws it in that colour, `false` draws none. Left out, a ring with a `progress` has its usual track (`secondaryContainer`) and a spinner has none. |

### DataGrid

`packages/ui/src/components/DataGrid.tsx` — comportamento: segue `ThemeProvider density`; `columns[]` ha `align` e `renderCell`; prop nuove: `emptyState`, `height`, `hover`, `onClick`, `rowsPerPage`, `selected`, `tableTitle`, `width`; prop cambiate: `density`, `emptyMessage`, `rowStyle`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| columns * | `ColumnDefinition[]` |  |  | The columns, in order. Keep the array stable (`useMemo`), and `onClick` too (`useCallback`): a row is drawn again only when something it shows changes, which a new array every render defeats. |
| data * | `any[]` |  |  |  |
| density | `Density` |  | cambiata | Row height; follows `ThemeProvider`'s `density` unless set here. |
| emptyMessage | `ReactNode` |  | cambiata | Shown centered when data is empty and not loading. |
| emptyState | `ReactNode` |  | nuova | Drawn instead of `emptyMessage` when data is empty and not loading: an illustration, a call to action. |
| headerStyle | `ViewStyle` |  |  |  |
| height | `DimensionValue` |  | nuova | Height of the grid. The header stays in place and the rows scroll under it (a virtualised list). Without it the grid fills the height of its container, which must then be bounded for the rows to scroll. |
| hover | `boolean` | false | nuova | Highlights the row under the pointer, on web; a row with `onClick` also highlights while pressed. |
| loading | `boolean` | false |  |  |
| onClick | `(row: any, index: number) => void` |  | nuova | Called with the row and its index in `data` when a row is pressed. Giving it makes the rows pressable: a button on iOS and Android, where a cell then should not hold a control of its own (the row is read as one element); a focusable row on the web, which Enter presses. |
| onColumnReorder | `(newColumns: ColumnDefinition[]) => void` |  |  |  |
| onEndReached | `() => void` |  |  |  |
| onEndReachedThreshold | `number` | 0.5 |  |  |
| onSort | `(columnId: string, direction: "asc" \| "desc") => void` |  |  |  |
| rowsPerPage | `number` |  | nuova | Rows per page. A number slices `data` into pages and shows a `Pagination` under the grid (hidden while there is no data); the page goes back to the first when `rowsPerPage` or the number of rows changes. Left out, every row is one scrolling list. Not meant to be combined with `onEndReached`: a page is finished by the user, not by scrolling. |
| rowStyle | `ViewStyle \| ((row: any, index: number) => ViewStyle \| undefined)` |  | cambiata | One style for every row, or a function of the row (to dim or highlight one). |
| selected | `number \| number[]` |  | nuova | The row index, or indexes, to draw as selected. An index is a position in `data`, not in the page shown, so it follows the order `data` is given in (sort the rows before passing them). The row is marked selected for assistive technology too. |
| sortColumn | `string` |  |  |  |
| sortDirection | `"asc" \| "desc"` |  |  |  |
| style | `ViewStyle` |  |  |  |
| tableTitle | `string` |  | nuova | A heading drawn above the header row. |
| width | `DimensionValue` |  | nuova | Width of the grid. Without it the grid fills its container. |

### DatePicker

`packages/ui/src/components/DatePicker.tsx` — prop nuove: `fieldVariant`, `presentation`, `showOkButton`, `showToday`, `variant`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on, `"picker"` or typed `"keyboard"` entry. There is no toggle between the two in the dialog, so this is the only way to get typed entry there. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| fieldVariant | `"outlined" \| "filled"` |  | nuova | The look of the field's box, as `variant` on `Input`: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box that shows its border only while the picker is open, the typed text has focus, or there is an `error`. Named apart from `variant`, which already chooses between the field and the inline picker. Does nothing for `variant="static"`, which has no field. Defaults to `"outlined"`. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "OK", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| presentation | `DateTimePickerPresentation` |  | nuova | Web only, `variant="default"` only: whether the picker opens docked to its field or as a dialog. Decided each time it opens. Native always opens the dialog. Defaults to `"auto"`. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| selectionMode | `"single"` |  |  |  |
| showOkButton | `boolean` | true | nuova | Shows the OK button in the popup. Default `true`. Set to `false` and the picker finishes by itself instead of waiting for OK: a time is set and the popup closes once the minute is picked (`mode="datetime"`: after the day, the hour and the minute), and a date range once its second end is. A single date already closes on the tap. It has no effect on `selectionMode="multiple"`, which cannot tell when it is finished, nor on typed entry (`defaultInputType="keyboard"`), which keeps its OK; and a `variant="static"` picker has no popup, so it does nothing there. |
| showToday | `boolean` |  | nuova | Offers a "Today" button next to the month arrows. Default `true`. Only a single-date calendar has one, and it is disabled while today is outside `validRange` or excluded by `isDateDisabled`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |
| variant | `DateTimePickerVariant` |  | nuova | `"default"` shows a field that opens the picker in a popover (web) or a dialog; dismiss it by tapping outside, with the back gesture or with Escape. `"static"` draws the picker inline in the page instead: no field, no popup, no OK, and every selection calls `onChange` at once with the live value. Of the field props only `disabled` and `style` apply to a static picker, and it always shows the calendar and the clock, never typed entry. |

### DateTimePicker

`packages/ui/src/components/DateTimePicker.tsx` — prop nuove: `fieldVariant`, `presentation`, `showOkButton`, `showToday`, `variant`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on, `"picker"` or typed `"keyboard"` entry. There is no toggle between the two in the dialog, so this is the only way to get typed entry there. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| fieldVariant | `"outlined" \| "filled"` |  | nuova | The look of the field's box, as `variant` on `Input`: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box that shows its border only while the picker is open, the typed text has focus, or there is an `error`. Named apart from `variant`, which already chooses between the field and the inline picker. Does nothing for `variant="static"`, which has no field. Defaults to `"outlined"`. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "OK", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| mode | `DateTimePickerMode` |  |  |  |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| presentation | `DateTimePickerPresentation` |  | nuova | Web only, `variant="default"` only: whether the picker opens docked to its field or as a dialog. Decided each time it opens. Native always opens the dialog. Defaults to `"auto"`. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| selectionMode | `"single"` |  |  |  |
| showOkButton | `boolean` | true | nuova | Shows the OK button in the popup. Default `true`. Set to `false` and the picker finishes by itself instead of waiting for OK: a time is set and the popup closes once the minute is picked (`mode="datetime"`: after the day, the hour and the minute), and a date range once its second end is. A single date already closes on the tap. It has no effect on `selectionMode="multiple"`, which cannot tell when it is finished, nor on typed entry (`defaultInputType="keyboard"`), which keeps its OK; and a `variant="static"` picker has no popup, so it does nothing there. |
| showToday | `boolean` |  | nuova | Offers a "Today" button next to the month arrows. Default `true`. Only a single-date calendar has one, and it is disabled while today is outside `validRange` or excluded by `isDateDisabled`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |
| variant | `DateTimePickerVariant` |  | nuova | `"default"` shows a field that opens the picker in a popover (web) or a dialog; dismiss it by tapping outside, with the back gesture or with Escape. `"static"` draws the picker inline in the page instead: no field, no popup, no OK, and every selection calls `onChange` at once with the live value. Of the field props only `disabled` and `style` apply to a static picker, and it always shows the calendar and the clock, never typed entry. |

### DrawerItem

`packages/ui/src/components/Drawer.tsx` — prop nuove: `children`, `defaultExpanded`, `onClick`, `onToggle`; prop tolte: `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| badge | `string \| number` |  |  | Trailing text, e.g. an unread count: `24`, `"100+"`. |
| children | `React.ReactNode` |  | nuova | Sub-items (`DrawerItem`s): makes this a group. Pressing it toggles them, and they are indented one level. Hidden while the drawer is `collapsed`. |
| defaultExpanded | `boolean` | false | nuova | For a group: start open. Defaults to `false`. |
| disabled | `boolean` | false |  |  |
| icon | `MaterialCommunityIconsGlyphs` |  |  | Leading glyph. The active state strips an "-outline" suffix. |
| onClick | `() => void` |  | nuova | Optional for an item with `children`, whose press opens and closes them. |
| onToggle | `(expanded: boolean) => void` |  | nuova | For a group: called with the new state after the user toggles it. |
| selected | `boolean` | false |  | Whether this is the current destination. |
| testID | `string` |  |  |  |

### DrawerSection

`packages/ui/src/components/Drawer.tsx` — prop nuove: `collapsible`, `defaultExpanded`, `onToggle`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| collapsible | `boolean` | false | nuova | Makes the title a button that opens and closes the items. Needs a `title`. |
| defaultExpanded | `boolean` | true | nuova | For a collapsible section: start open. Defaults to `true`. |
| onToggle | `(expanded: boolean) => void` |  | nuova | For a collapsible section: called with the new state after the user toggles it. |
| showDivider | `boolean` | false |  | Draws a divider above the section — between it and the one before. |
| title | `string` |  |  | Section headline. |

### FAB

`packages/ui/src/components/FAB.tsx` — prop nuove: `onClick`, `animateFrom`, `duration`, `extended`, `iconMode`, `testID`, `variant`; prop cambiate: `feedback`, `placement`, `position`, `size`; prop tolte: `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| icon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| onClick * | `() => void` |  | nuova |  |
| animateFrom | `"left" \| "right"` |  | nuova | `animated` only: edge the label grows from. Match it to the FAB's corner. |
| disabled | `boolean` |  |  |  |
| duration | `number` |  | nuova | `animated` only: animation duration (ms). Defaults to 150. |
| extended | `boolean` |  | nuova | `animated` only. `true` shows the label, `false` collapses to the icon. Drive it from a scroll offset to get the M3 "shrink on scroll" behaviour. Defaults to `true`. |
| feedback | `boolean` |  | cambiata | Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| iconMode | `"static" \| "dynamic"` |  | nuova | `animated` only. `static` keeps the icon put and slides the label out beside it; `dynamic` lets the icon travel with the label as the pill grows. |
| label | `string` |  |  | The text of `extended` and `animated`, and the accessible name of every variant. Without it those two variants fall back to the icon alone. |
| placement | `FABPlacement` |  | cambiata |  |
| position | `FABPosition` |  | cambiata |  |
| size | `FABSize` |  | cambiata | Defaults to `"medium"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  | nuova |  |
| variant | `FABVariant` |  | nuova | Defaults to `"icon"`. |

### Grid

`packages/ui/src/components/Layout/Grid.tsx` — prop nuove: `autoSize`, `children`, `container`, `size`, `style`, `wrap`; prop cambiate: `columns`, `spacing`; prop tolte: `minChildWidth`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| autoSize | `boolean \| GridSize \| GridAutoSizeFn` | false | nuova | Sizes the children of a container that have no `size` of their own, so they do not need one each. `true` is a card per row on a phone, two from `sm` and three from `md` (`{ xs: 12, sm: 6, md: 4 }`, for 12 columns); a size gives every child that size; a function is called with the index and the element of each child (its `key` is `child.key`) and returns its size: `(index, child) => child.key === "notes" ? { xs: 12 } : { xs: 12, md: 6 }`. A child that is not a `Grid` is put in an item of the size it gets. |
| children | `ReactNode` |  | nuova |  |
| columns | `number` | 12 | cambiata | Columns in a row of this container; an item's `size` counts in them. |
| container | `boolean` | false | nuova | Makes this grid lay its children out in rows of `columns` columns. The grid items go inside it, each with its own `size`. A container inside another container is also an item of it, and takes a `size` too. |
| size | `GridSize` |  | nuova | An item's width in the container's row: a number of columns (1 to `columns`), `"grow"` to share the rest of the row, `"auto"` to size to its content, or an object with one of those for each breakpoint (`{ xs: 12, md: 6 }`). A breakpoint without a value takes the next smaller one that has; with none, the item is `"auto"`. Without `size` an item is `"auto"`, unless the container has `autoSize`. |
| spacing | `GridSpacing` | "s" | cambiata | Gap between the items of a container: a number of px, a spacing token name (`"m"`), or `{ row, column }` of those for the two axes. |
| style | `StyleProp<ViewStyle>` |  | nuova |  |
| wrap | `boolean` | true | nuova | Whether a container moves items that do not fit onto the next row. |

### HStack

`packages/ui/src/components/Layout/Stack.tsx` — prop nuove: `background`, `children`, `dividers`, `margin`, `padding`, `style`; prop cambiate: `spacing`; prop tolte: `bg`, `flex`, `m`, `mb`, `ml`, `mr`, `mt`, `mx`, `my`, `p`, `pb`, `pl`, `pr`, `pt`, `px`, `py`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  |  | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  |  |  |
| children | `React.ReactNode` |  | nuova |  |
| dividers | `React.ReactNode` |  | nuova | Puts a divider between the children. `true` draws a hairline, vertical in a horizontal stack; a node is used as the divider instead. Empty children (`null`, `false`) get none, and the spacing applies on both sides of it. |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingInput` |  | cambiata | Space between children — a spacing token name (`"m"`), a number of px, or a string holding one (`"12"`). |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  | Lets children flow onto the next line (or column) instead of overflowing. |

### IconButton

`packages/ui/src/components/IconButton.tsx` — prop nuove: `badge`, `color`, `onClick`, `title`, `variant`; prop tolte: `mode`, `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityLabel * | `string` |  |  | Required: an icon alone carries no accessible name. |
| icon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| badge | `number` |  | nuova | A count on the top-right corner (a `Badge`). Hidden at 0 or when left out. |
| color | `ColorRole` |  | nuova | Colour role of the button. Left out, it keeps the neutral M3 look (`onSurfaceVariant`, `primary` once selected). |
| disabled | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report the press (a toggle when `selected` is set) to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| loading | `boolean` |  |  |  |
| onClick | `() => void` |  | nuova |  |
| selected | `boolean` |  |  | Renders the M3 "selected" container of a toggle icon button. |
| size | `IconButtonSize` | "medium" |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| title | `string` |  | nuova | A tooltip with this text: on hover or focus on the web, on long press on native. It is a label for sighted users; `accessibilityLabel` stays the accessible name. |
| variant | `IconButtonVariant` | "standard" | nuova | M3 icon-button container styles. Defaults to `"standard"`. |

### Input

`packages/ui/src/components/Input.tsx` — comportamento: segue `ThemeProvider density`; `decimalSeparator` cambia come si scrive e si vede il numero, non il valore consegnato; prop nuove: `onChange`, `allUpperCase`, `decimalSeparator`, `density`, `endAdornment`, `fullWidth`, `inputProps`, `inputRef`, `labelPlacement`, `reserveHelperText`; prop cambiate: `minHeight`; prop tolte: `onChangeText`, `multiline`, `numberOfLines`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(text: string) => void` |  | nuova | Called with the new text on every edit (for `type="number"`, already cleaned). |
| value * | `string` |  |  |  |
| allUpperCase | `boolean` | false | nuova | Capitalises what is typed (codes, plates, tax ids). Not for `type="number"`. |
| decimalSeparator | `"." \| ","` | "." | nuova | The decimal mark a `type="number"` field types and shows: `","` for a user who writes 12,50. `value` and `onChange` stay in the plain form ("12.50"), so the app parses nothing; a typed "." is then ignored, as a thousands mark. Defaults to `"."`. |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 56, 14 px text, less space below. |
| disabled | `boolean` |  |  |  |
| endAdornment | `React.ReactNode` |  | nuova | Any element drawn at the end of the field, after `suffix` or `trailingIcon` (which keep working): an `IconButton` with its own accessible name, a spinner, a unit picker. It is not clipped by the field and takes its own touches. |
| error | `string` |  |  |  |
| fullWidth | `boolean` | true | nuova | Stretches the field to its container's width. `false` shrinks it to its content, with a minimum width so an empty field stays usable. Defaults to `true`. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputProps | `InputTextInputProps` |  | nuova | Autofill and keyboard hints, focus and key handling for the underlying `TextInput`: `autoComplete`, `textContentType`, `autoCorrect`, `autoCapitalize`, `spellCheck`, `autoFocus`, `selectTextOnFocus`, `returnKeyType`, `enterKeyHint`, `onSubmitEditing`, `onKeyPress`, `accessibilityLabel` / `accessibilityValue` (replace the ones drawn from `label` and `value`) and `testID`. |
| inputRef | `React.Ref<TextInput>` |  | nuova | A ref to the underlying `TextInput`, to focus it or select its text. |
| label | `string` |  |  |  |
| labelPlacement | `"inside" \| "outside"` |  | nuova | Where the label is drawn: `"outside"` above the box, or `"inside"`, small, above the text within it. Independent of `variant`. Defaults to `"outside"`. |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| maxLength | `number` |  |  |  |
| minHeight | `number` |  | cambiata | Overrides the height `density` gives (56, or 40 when dense). |
| onBlur | `() => void` |  |  | Called when the field loses focus. |
| onFocus | `() => void` |  |  | Called when the field gains focus. |
| onTrailingIconPress | `() => void` |  |  | Pressing `trailingIcon`. It is a bare, unlabelled icon: for a real control use `endAdornment`. |
| placeholder | `string` |  |  |  |
| precision | `number` |  |  |  |
| prefix | `string` |  |  |  |
| readonly | `boolean` |  |  |  |
| required | `boolean` |  |  | Marks the label with an asterisk. |
| reserveHelperText | `boolean` | false | nuova | Keeps the line under the field even with no helper or error text, so a message appearing does not push the next field down. Default false. |
| secureTextEntry | `boolean` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| suffix | `string` |  |  |  |
| trailingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| type | `"text" \| "number"` | "text" |  |  |
| variant | `"outlined" \| "filled"` | "outlined" |  | The look of the box: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box (like `PinInput`'s) that shows its border only while focused or in error. Where the label sits is `labelPlacement`'s business, not the variant's. Defaults to `"outlined"`. |

### LinearProgress

`packages/ui/src/components/Progress/LinearProgress.tsx` — prop nuove: `label`, `labelPosition`, `width`; prop cambiate: `height`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| color | `string` |  |  |  |
| decorative | `boolean` | false |  | Hide the bar from assistive technology, for when the component around it already announces the progress — a bar inside a button is not a second control to land on. |
| duration | `number` | 500 |  |  |
| height | `DimensionValue` |  | cambiata | Bar thickness. A percentage fills the parent — a progress surface. Defaults to 4, and to 20 when the label is `"inside"`, which has to fit on the bar. |
| indeterminate | `boolean` | false |  |  |
| indeterminateDuration | `number` | 1500 |  |  |
| label | `React.ReactNode` |  | nuova | Text, a number or any node drawn with the bar, at `labelPosition`. Text is drawn in the theme's type; a node as given. |
| labelPosition | `LinearProgressLabelPosition` | "right" | nuova | Where `label` goes: above (`"top-left"`, `"top-center"`, `"top-right"`) or below (`"bottom-*"`) the bar, aligned as named, beside it (`"left"`, `"right"`), or `"inside"`, centred on the bar. Inside, text is drawn in two colours, over the filled part and over the track, so it reads on both; that suits a bar with a `progress`, on an indeterminate one the text is only legible over the track. Defaults to `"right"`. |
| progress | `number` | 0 |  |  |
| trackColor | `string` |  |  |  |
| width | `DimensionValue` | "100%" | nuova | Width of the whole component, label included. Defaults to the full width of the parent. |

### ListItem

`packages/ui/src/components/List/ListItem.tsx` — comportamento: `primaryText` e `secondaryText` accettano un nodo; solo il testo viene avvolto in `Text`; prop nuove: `primaryText`, `action`, `dimmed`, `disabled`, `icon`, `indicatorColor`, `onClick`, `primaryTextStyle`, `secondaryText`, `secondaryTextStyle`, `testID`, `trailingWidth`, `variant`; prop tolte: `children`, `itemSecondaryTextStyle`, `itemTextStyle`, `leading`, `onPress`, `secondary`, `trailing`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| primaryText * | `React.ReactNode` |  | nuova | The first line. Text is drawn in the theme's type; any other node is drawn as given. |
| action | `React.ReactNode` |  | nuova | Trailing slot: a value, a Switch, an `IconButton`, a chevron. |
| dimmed | `boolean` | false | nuova | Faded, for a row that is removed or inactive. Still pressable. |
| disabled | `boolean` | false | nuova | Fades the row and stops it being pressed. The `action` is not disabled with it: it is a control of its own. |
| icon | `MaterialCommunityIconsGlyphs \| Exclude<React.ReactNode, string>` |  | nuova | Leading slot: a glyph name, or any node (an Avatar, a Checkbox). |
| indicatorColor | `string` |  | nuova | A coloured bar on the left edge, for a status or a priority. |
| itemContainerStyle | `object` |  |  |  |
| itemHoveredStyle | `object` |  |  |  |
| itemPressedStyle | `object` |  |  |  |
| onClick | `() => void` |  | nuova | Called when the row is pressed. Giving it makes the whole row pressable, the `action` zone included. The `action` is a sibling of the row's button, never inside it: a control in it (an `IconButton`, a Switch) runs its own handler and never this one, while a bare icon, chip or text there presses the row. |
| primaryTextStyle | `StyleProp<TextStyle>` |  | nuova | Merged after the type of `primaryText`; applies when it is text, a node styles itself. |
| secondaryText | `React.ReactNode` |  | nuova | Second line below `primaryText`. Text or any node, like `primaryText`. |
| secondaryTextStyle | `StyleProp<TextStyle>` |  | nuova | Merged after the type of `secondaryText`; applies when it is text, a node styles itself. |
| testID | `string` |  | nuova |  |
| trailingWidth | `number` |  | nuova | Fixes the width of the `action` slot and right-aligns it, so a column of rows lines its actions up. |
| variant | `ListItemVariant` | "contained" | nuova | How the row is drawn. `"contained"` (the default) fills it with the `secondaryContainer` surface; `"outlined"` draws it on no fill with an outline; `"standard"` is transparent with no border, like the rows of a sidebar. The border is the same width in all three and in every state, so hover and press never move the layout. |

### ListSection

`packages/ui/src/components/List/ListSection.tsx` — prop nuove: `gap`, `showDividers`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| divider | `boolean` | false |  | One rule below the section, after its last item: it closes the group, for a settings screen of stacked groups. `showDividers` is the rules *between* the items, and the two can be used together. |
| gap | `"xs" \| "s" \| "m" \| "l" \| "xl" \| number` |  | nuova | Space between consecutive items: a spacing token (`"xs"` 4, `"s"` 8, `"m"` 16, `"l"` 24, `"xl"` 32) or a number of pixels. Each `ListItem` already keeps a small margin of its own: this is added to it. |
| showDividers | `boolean` | false | nuova | A rule between each pair of consecutive items, so `n` items get `n - 1` rules, none before the first or after the last (that one is `divider`). With a `gap`, the rule sits in the middle of it. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| title | `string` |  |  | Group label rendered above the rows as a heading. |

### Menu

`packages/ui/src/components/Menu.tsx` — prop nuove: `onClose`, `anchorPosition`, `dividers`, `onClick`, `selected`; prop tolte: `onDismiss`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| anchor * | `React.ReactElement` |  |  | The element the menu opens from. |
| items * | `MenuItem[]` |  |  |  |
| onClose * | `() => void` |  | nuova | Called on a press outside the menu, on Android back, and after an item is clicked when `closeOnSelect` is on. |
| visible * | `boolean` |  |  | Whether the menu is open. |
| anchorPosition | `AnchorPosition` |  | nuova | Where the menu sits against its anchor: `vertical` is `"bottom"` (below it), `"top"` (above it) or `"center"` (centred on it); `horizontal` lines up the `"left"` edges, the `"right"` edges or the `"center"`s. It flips or slides to stay on screen. Defaults to `{ vertical: "bottom", horizontal: "left" }`. |
| closeOnSelect | `boolean` | true |  | Close the menu automatically after an item is clicked. Default true. |
| dividers | `boolean` | false | nuova | Draws a divider between every pair of items, on top of any `dividerAbove`. Defaults to `false`. |
| onClick | `(item: MenuItem) => void` |  | nuova | Called with the clicked item, after the item's own `onClick`. |
| selected | `string[]` |  | nuova | The `id`s of the items to draw as selected: a tinted row with a check mark, and `accessibilityState.selected` set on it. Items are not marked until you pass it, even as `[]`. |

### NavigationRail

`packages/ui/src/components/NavigationRail.tsx` — prop cambiate: `items`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeId * | `string` |  |  | `id` of the current destination. |
| items * | `NavBarItem[]` |  | cambiata | Destinations, same shape as `NavBar`'s. Three to seven per M3. |
| onItemPress * | `(id: string) => void` |  |  |  |
| alignment | `"top" \| "center"` | "top" |  | Where the destinations sit vertically. Defaults to `"top"`. |
| footer | `React.ReactNode` |  |  | Pinned to the bottom of the rail. |
| header | `React.ReactNode` |  |  | Above the destinations: typically a menu `IconButton` and/or a `FAB`. |
| showLabels | `"always" \| "selected" \| "none"` | "always" |  | `"always"` labels every destination, `"selected"` only the active one, `"none"` none (the label is still the accessible name). Defaults to `"always"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Pagination

`packages/ui/src/components/Pagination.tsx` — prop nuove: `activePage`, `onChange`, `color`, `pageSelect`, `size`, `variant`; prop tolte: `onPageChange`, `page`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activePage * | `number` |  | nuova | Current page, 1-based. |
| onChange * | `(page: number) => void` |  | nuova | Called with the page the user picked: a page button, an arrow or `pageSelect`. |
| totalPages * | `number` |  |  |  |
| color | `ColorRole` | "primary" | nuova | Colour role of the selected page. Defaults to `"primary"`. |
| disabled | `boolean` |  |  |  |
| pageSelect | `boolean` | false | nuova | Adds a small select after the pager that jumps to any page: it shows the active page, and opens a list of pages under a search field. Typing digits narrows the list to the pages that contain them, which keeps it usable with thousands of pages; Enter picks the first match. |
| showFirstLast | `boolean` | false |  | Show jump-to-first / jump-to-last arrows. |
| siblingCount | `number` | 1 |  | Pages shown on each side of the current page. |
| size | `PaginationSize` | "md" | nuova | Size of the buttons and their type: 32, 40 or 48 px. Defaults to `"md"`. |
| variant | `PaginationVariant` | "rounded" | nuova | `"rounded"` draws the buttons as rounded squares, `"circular"` as circles. Defaults to `"rounded"`. |

### PinInput

`packages/ui/src/components/PinInput.tsx` — prop nuove: `onChange`, `variant`; prop tolte: `onChangeText`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(value: string) => void` |  | nuova | Called with the whole code, not the single cell, on every edit. |
| value * | `string` |  |  |  |
| autoFocus | `boolean` |  |  |  |
| cellSize | `number` | 48 |  | Cell edge length. Defaults to 48. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| helperText | `string` |  |  | Supporting text below the cells; hidden while an error is shown. |
| label | `string` |  |  |  |
| length | `number` | 6 |  | Number of cells. Defaults to 6. |
| mask | `boolean` | false |  | Renders dots instead of characters. |
| onComplete | `(value: string) => void` |  |  | Fired once the last cell is filled. |
| required | `boolean` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| type | `"numeric" \| "alphanumeric"` | "numeric" |  | Restricts the accepted characters. Defaults to `"numeric"`. |
| variant | `"filled" \| "outlined"` | "outlined" | nuova | Cell style: `"outlined"` draws each cell as a bordered box on the surface, `"filled"` as a tinted box that shows its border only while focused or in error. Defaults to `"outlined"`. |

### Popover

`packages/ui/src/components/Popover.tsx` — prop nuove: `anchorPosition`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| anchor * | `React.ReactElement` |  |  | The element the popover opens from. It stays in the layout; the popover floats over the window. |
| children * | `React.ReactNode` |  |  |  |
| onDismiss * | `() => void` |  |  | Called on a press outside the popover and on Android back. |
| visible * | `boolean` |  |  | Whether the popover is open. |
| anchorPosition | `AnchorPosition` | { vertical: "bottom", horizontal: "left" } | nuova | Where the popover sits against its anchor: `vertical` is `"bottom"` (below it), `"top"` (above it) or `"center"` (centred on it); `horizontal` lines up the `"left"` edges, the `"right"` edges or the `"center"`s. Whatever it asks, the popover flips or slides to stay on screen. Defaults to `{ vertical: "bottom", horizontal: "left" }`. |
| matchAnchorWidth | `boolean` |  |  | Gives the popover the anchor's width instead of sizing it to its content. |

### ProgressButton

`packages/ui/src/components/ProgressButton.tsx` — prop nuove: `onClick`, `type`, `variant`; prop tolte: `mode`, `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityLabel | `string` |  |  | Accessible name while idle. Falls back to the label. |
| children | `string` |  |  | The idle label. Also the loading label unless `loadingLabel` is set. |
| disabled | `boolean` | false |  |  |
| duration | `number` | 300 |  | Duration of each progress step's transition, in ms. |
| errorIconName | `MaterialCommunityIconsGlyphs` | "alert-circle-outline" |  |  |
| errorLabel | `string` | "Try again" |  | Label once the task failed. The button stays pressable, to retry. |
| fullWidth | `boolean` | false |  |  |
| iconName | `MaterialCommunityIconsGlyphs` |  |  | Leading icon while idle and loading. |
| indicator | `"fill" \| "bar"` | "fill" |  | How progress is drawn inside the surface: `fill` sweeps a darker (or, in the dark scheme, lighter) tone of the button across it; `bar` runs a 4dp line along its bottom edge. |
| labelStyle | `StyleProp<TextStyle>` |  |  | Applied to the label: font family, size, weight. |
| loadingLabel | `string` |  |  | Label while loading, e.g. "Calculating route…". |
| onClick | `() => void` |  | nuova | Fires in every status but `loading`, where the button is busy. |
| onSuccessEnd | `() => void` |  |  | Called `successDuration` ms after the button turned to success. |
| progress | `number` |  |  | Completion while `status` is `"loading"`, from 0 to 1. Leave it undefined when the task cannot say how far along it is, for an indeterminate sweep. |
| progressColor | `string` |  |  | Colour of the fill or the bar. Derived from the button's colours if unset. |
| status | `ProgressButtonStatus` | "idle" |  | Which moment of the task to show. Controlled: the button never moves itself from one status to the next — the caller does, as the task reports. |
| style | `StyleProp<ViewStyle>` |  |  | Applied to the surface: corner radius, padding, width. |
| successDuration | `number` | 2000 |  | How long the success status holds before `onSuccessEnd` fires, in ms. `0` keeps it until the caller changes `status`. |
| successIconName | `MaterialCommunityIconsGlyphs` | "check" |  |  |
| successLabel | `string` | "Done" |  | Label once the task succeeded. |
| testID | `string` |  |  |  |
| trackColor | `string` |  |  | Colour behind the bar, and behind the fill on outlined and text. |
| type | `"button" \| "submit"` |  | nuova | `"submit"` submits the enclosing `Form` when pressed, after `onClick`, as on `Button`. |
| variant | `ButtonVariant` | "filled" | nuova |  |

### Rating

`packages/ui/src/components/Rating.tsx` — prop nuove: `icon`, `interval`, `required`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| value * | `number` |  |  | Current rating; fractions are drawn as a partly filled icon (e.g. 3.5). |
| disabled | `boolean` |  |  |  |
| icon | `OutlinedGlyph` | "star" | nuova | The filled glyph. Its `-outline` variant draws the empty state, so it has to be one that has one (`"heart"` does, `"star"` does). Defaults to `"star"`. |
| interval | `0.5 \| 1` | 1 | nuova | The step of the rating: `1` rates whole icons, `0.5` lets the pointer pick either half of an icon. Defaults to `1`. |
| max | `number` | 5 |  |  |
| onChange | `(value: number) => void` |  |  | Interactive when provided. |
| required | `boolean` | false | nuova | The rating cannot be cleared: tapping the current value keeps it. Without it, tapping the current value resets the rating to 0. |
| size | `number` | 24 |  |  |

### SearchBar

`packages/ui/src/components/SearchBar.tsx` — prop nuove: `onChange`, `debounceTime`, `icon`, `showLoading`; prop tolte: `onChangeText`, `leadingIcon`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(text: string) => void` |  | nuova | Called with the text as it changes. With `debounceTime` it waits until the user has stopped typing; submitting or clearing reports at once. |
| value * | `string` |  |  |  |
| autoFocus | `boolean` |  |  |  |
| debounceTime | `number` | 0 | nuova | Milliseconds the user must stop typing before `onChange` fires. The field itself always updates at once; a `value` set from outside replaces the text and drops a pending `onChange`. Defaults to 0: every keystroke. |
| disabled | `boolean` |  |  |  |
| icon | `MaterialCommunityIconsGlyphs` | "magnify" | nuova | Glyph at the start of the bar. Defaults to `"magnify"`. |
| onClear | `() => void` |  |  | Called after the clear button empties the field. |
| onSubmit | `(text: string) => void` |  |  |  |
| placeholder | `string` | "Search" |  |  |
| showLoading | `boolean` | false | nuova | Tells the bar a search is running: a progress indicator takes the place of the clear button. Defaults to `false`. |
| style | `StyleProp<ViewStyle>` |  |  |  |

### Select

`packages/ui/src/components/Select.tsx` — comportamento: segue `ThemeProvider density`; prop nuove: `density`, `disabledOptions`, `emptyMessage`, `fullWidth`, `labelPlacement`, `multiple`, `nullable`, `onChange`; prop cambiate: `value`; prop tolte: `onSelect`, `multiSelect`, `selectedValues`, `toggleOptions`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| options * | `Option[]` |  |  |  |
| defaultOpen | `boolean` | false |  | Mount with the option list already open. Uncontrolled after that. |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 52, 14 px text, less space below. |
| disabled | `boolean` |  |  |  |
| disabledOptions | `RegExp \| (string \| number)[]` |  | nuova | Options that stay visible but cannot be picked, announced as disabled: the `value`s to disable, or a pattern tested against each `String(value)`. |
| emptyMessage | `string` | "No options" | nuova | Shown in the open list when `options` is empty. Defaults to `"No options"`. |
| error | `string` |  |  |  |
| fullWidth | `boolean` | true | nuova | Stretches the select to its container's width. `false` shrinks it to its content, with a minimum width. Defaults to `true`. |
| label | `string` |  |  |  |
| labelPlacement | `"inside" \| "outside"` | "outside" | nuova | Where the label is drawn: `"outside"` above the box, or `"inside"`, small, above the value. Independent of `variant`; with chips showing it stays above the box. Defaults to `"outside"`. |
| multiple | `boolean` | false | nuova | Picks several options at once; the list stays open. `value` and `onChange` then carry arrays. |
| nullable | `boolean` | false | nuova | Lets the user go back to no selection: a clear button shows in the field while an option is selected, and pressing the selected option again deselects it. Both call `onChange(null)`. Ignored with `multiple`, where every option can already be unchecked. Defaults to `false`. |
| onChange | `(value: any) => void` |  | nuova | Called with the picked option's `value`, or with `null` when a `nullable` select is cleared. With `multiple`: called with the new array of selected `value`s on every toggle (a new array, never the one passed as `value`). |
| optionStyle | `object` |  |  |  |
| placeholder | `string` | "Select an option" |  |  |
| showAsChips | `boolean` | false |  | With `multiple`, shows the selection as removable chips in the field. |
| style | `object` |  |  |  |
| value | `any` |  | cambiata | The `value` of the selected option, `null` for none. With `multiple`: the array of selected `value`s (defaults to `[]`). |
| variant | `SelectVariant` | "outlined" |  | The look of the box: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box (like `PinInput`'s) that shows its border only while focused or in error. Where the label sits is `labelPlacement`'s business, not the variant's. Defaults to `"outlined"`. |

### Slider

`packages/ui/src/components/Slider.tsx` — prop nuove: `interaction`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: number) => void` |  |  |  |
| value * | `number` |  |  |  |
| disabled | `boolean` |  |  | Blocks the pointer, the keyboard and assistive actions, and dims the slider. |
| feedback | `boolean` | true |  | Report each step the thumb crosses to `ThemeProvider`'s `onInteractionFeedback` (haptics), as a selection. Only with a `step`: a continuous slider would report every pixel. Defaults to true. |
| interaction | `SliderInteraction` | "both" | nuova | What a pointer (finger or mouse) may do: `"both"` drags the thumb and jumps to where the track is pressed, `"drag"` only drags the thumb, `"click"` only jumps to the pressed point. The keyboard (arrows, Page Up/Down, Home/End) and assistive actions work in every mode. Defaults to `"both"`. |
| label | `string` |  |  |  |
| marks | `boolean` | false |  | Draw a tick at every step (requires step > 0). |
| max | `number` | 100 |  |  |
| min | `number` | 0 |  |  |
| onSlidingComplete | `(value: number) => void` |  |  |  |
| showValueLabel | `boolean` | false |  |  |
| step | `number` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### Snackbar

`packages/ui/src/components/Snackbar.tsx` — comportamento: `success` usa i ruoli del tema; icone per `warning` e `info`; prop nuove: `onClose`, `position`, `severity`, `variant`; prop cambiate: `action`, `onDismiss`; prop tolte: `type`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| message * | `string` |  |  |  |
| visible * | `boolean` |  |  | Whether the snackbar is on screen. |
| action | `{ label: string; onClick: () => void; }` |  | cambiata | A text button after the message. Clicking it runs `onClick`, then dismisses the snackbar. |
| duration | `number` | 4000 |  | Auto-hide delay in ms; `0` keeps it up. Defaults to 4000. Not used when `onClose` is set. |
| icon | `MaterialCommunityIconsGlyphs` |  |  | Overrides the icon implied by `severity`. |
| onClose | `() => void` |  | nuova | Shows a close icon button and keeps the snackbar up until the user closes it: `duration` is not used, and the timeout never calls `onDismiss`. |
| onDismiss | `() => void` |  | cambiata | Called when the snackbar times out (after `duration`) or its `action` is clicked. Not called when `onClose` is set: the snackbar then stays up until the user closes it. |
| position | `SnackbarPosition` | "bottom-center" | nuova | Which edge and corner it sits in, clear of the safe-area insets. Defaults to `"bottom-center"`. |
| severity | `SnackbarSeverity` |  | nuova | What the message is about: `"success"` is green, `"info"` blue, `"warning"` amber and `"error"` red, with a matching icon. Left out, the snackbar is the neutral inverse surface, with no icon. |
| variant | `SnackbarVariant` | "contained" | nuova | `"contained"` fills it with the severity's colours; `"outlined"` draws it on the surface with a severity-coloured outline, label and icon. Defaults to `"contained"`. |

### Stack

`packages/ui/src/components/Layout/Stack.tsx` — prop nuove: `align`, `background`, `borderColor`, `borderWidth`, `children`, `dividers`, `height`, `justify`, `margin`, `padding`, `radius`, `style`, `width`, `wrap`; prop cambiate: `spacing`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  | nuova |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  | nuova | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  | nuova |  |
| children | `React.ReactNode` |  | nuova |  |
| direction | `"vertical" \| "horizontal"` | "vertical" |  | Stacking axis. Defaults to `"vertical"`. |
| dividers | `React.ReactNode` |  | nuova | Puts a divider between the children. `true` draws a hairline, vertical in a horizontal stack; a node is used as the divider instead. Empty children (`null`, `false`) get none, and the spacing applies on both sides of it. |
| height | `ViewStyle["height"]` |  | nuova |  |
| justify | `ViewStyle["justifyContent"]` |  | nuova |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  | nuova | Corner radius — a shape token name or a raw radius. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingInput` | "s" | cambiata | Space between children — a spacing token name (`"m"`), a number of px, or a string holding one (`"12"`). |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| width | `ViewStyle["width"]` |  | nuova |  |
| wrap | `boolean` |  | nuova | Lets children flow onto the next line (or column) instead of overflowing. |

### Stat

`packages/ui/src/components/Stat.tsx` — prop nuove: `direction`, `trendColor`; prop tolte: `invertTrendColors`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  | What the number measures. |
| value * | `string` |  |  | The number itself; pre-formatted by the caller. |
| delta | `string` |  |  | Signed change shown next to an up/down arrow, e.g. `"12.5%"`. |
| direction | `"column" \| "row"` | "column" | nuova | `"column"` stacks the label over the value. `"row"` puts them on one line, the value after the label, with the delta right behind the value. Defaults to `"column"`. |
| helpText | `string` |  |  | Extra context under the value. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| trend | `"up" \| "down" \| "flat"` |  |  | Direction of `delta`. Drives the arrow, and the colour unless `trendColor` is set. |
| trendColor | `ThemeColor` |  | nuova | The colour of the arrow and `delta`: a theme colour token (a role such as `"success"` or `"error"`, or `"onSurfaceVariant"`, ...) or any colour string. Left out, `"up"` is `success`, `"down"` is `error` and `"flat"` neutral. For a metric where down is good, pass the colour yourself. |

### StatusBadge

`packages/ui/src/components/StatusBadge.tsx` — prop nuove: `toneFrom`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| icon | `string` |  |  |  |
| toneFrom | `string` |  | nuova | Tints the badge from a `#RRGGBB` colour or from any text instead of from `type`, which still picks the default icon. |
| type | `"success" \| "error" \| "warning"` | "success" |  |  |

### Stepper

`packages/ui/src/components/Stepper.tsx` — prop nuove: `direction`, `onClick`; prop tolte: `onStepPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeStep * | `number` |  |  | Position of the current step. Those before it are completed. |
| steps * | `Step[] \| string[]` |  |  | The steps, in order; a string is a step with just a label. |
| direction | `"row" \| "column"` | "row" | nuova | `"row"` lays the steps out side by side, the label under each circle; `"column"` stacks them, the label beside each circle. Defaults to `"row"`. |
| onClick | `(stepIndex: number) => void` |  | nuova | Called with the pressed step's position. Makes the steps pressable. |
| style | `object` |  |  |  |

### Table

`packages/ui/src/components/Table.tsx` — prop nuove: `columns`, `data`, `emptyMessage`, `height`, `hover`, `onClick`, `rowsPerPage`, `selected`, `tableTitle`, `testID`, `width`; prop cambiate: `children`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children | `ReactNode` |  | cambiata | The primitives (`TableHead`, `TableRow`, `TableCell`, ...), when you lay the rows out yourself. Ignored when `columns` is given. |
| columns | `TableColumn[]` |  | nuova | The columns. Giving them makes the table data driven: it draws `data` itself. When they add up to more than `width` the table scrolls sideways. |
| data | `TableRowData[]` |  | nuova | The rows, as `{ [column id]: cell }`. Data driven only. |
| emptyMessage | `ReactNode` |  | nuova | Shown under the header when `data` is empty. Defaults to `"No data"`. |
| height | `DimensionValue` |  | nuova | Height of the table. With it the rows scroll vertically under a header that stays in place; without it the table is as tall as its rows. |
| hover | `boolean` |  | nuova | Highlights the row under the pointer, on web; a row with `onClick` also highlights while pressed. |
| onClick | `(row: TableRowData, index: number) => void` |  | nuova | Called with the row and its index in `data` when a row is pressed. Giving it makes the rows pressable, with the button role. |
| rowsPerPage | `number` |  | nuova | Rows per page. A number slices `data` into pages and shows a `Pagination` under the table (hidden while there is no data); the page goes back to the first when `rowsPerPage` or the number of rows changes. Left out, every row is drawn in one page. |
| selected | `number \| number[]` |  | nuova | The row index, or indexes, to draw as selected. An index is a position in `data`, not in the page shown. The row is marked selected for assistive technology too. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| tableTitle | `string` |  | nuova | A heading drawn above the header row; also the table's accessible name. |
| testID | `string` |  | nuova |  |
| width | `DimensionValue` |  | nuova | Width of the table. Without it the table fills its container. |

### TableCell

`packages/ui/src/components/Table.tsx` — prop nuove: `align`, `flex`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| align | `TableAlign` | "left" | nuova |  |
| flex | `boolean` |  | nuova | Shares the row's free width with the other `flex` cells instead of having a fixed `width`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| textStyle | `StyleProp<TextStyle>` |  |  |  |
| width | `number` |  |  | Width in px. Defaults to 150. With `flex`, the narrowest the cell gets. |

### TableHeaderCell

`packages/ui/src/components/Table.tsx` — comportamento: il padding a destra c'è solo con le frecce di riordino; prop nuove: `align`, `flex`, `onClick`; prop tolte: `onPress`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| align | `TableAlign` | "left" | nuova |  |
| flex | `boolean` |  | nuova | Shares the row's free width with the other `flex` cells instead of having a fixed `width`. |
| onClick | `() => void` |  | nuova | Called when a `sortable` header is pressed. |
| onMoveLeft | `() => void` |  |  |  |
| onMoveRight | `() => void` |  |  |  |
| sortable | `boolean` |  |  |  |
| sortDirection | `"asc" \| "desc" \| null` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| width | `number` |  |  | Width in px. Defaults to 150. With `flex`, the narrowest the cell gets. |

### TableRow

`packages/ui/src/components/Table.tsx` — prop nuove: `hover`, `onClick`, `selected`, `testID`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| hover | `boolean` | false | nuova | Highlights the row under the pointer, on web. A row with `onClick` also highlights while it is pressed, `hover` or not. |
| onClick | `() => void` |  | nuova | Makes the row pressable. It then takes the button role, so give it a cell that says what it does. |
| selected | `boolean` | false | nuova | Draws the row highlighted and marks it selected for assistive technology. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  | nuova |  |

### Tabs

`packages/ui/src/components/Tab/Tabs.tsx` — comportamento: `tabs[]` può essere un oggetto `TabItem` con `key`, `disabled`, `icon` opzionale; prop nuove: `activeKey`, `color`, `fullWidth`, `height`, `showBorders`, `size`, `testID`, `variant`, `width`; prop cambiate: `onChange`, `tabs`, `activeTab`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(index: number, key?: string) => void` |  | cambiata | Called with the pressed tab's position and, when it has one, its `key`. |
| tabs * | `TabItem[] \| string[]` |  | cambiata |  |
| activeKey | `string` |  | nuova | The active tab by its `key`, for tabs that come and go (by role, by flag). |
| activeTab | `number` | 0 | cambiata | The active tab by position. Ignored when `activeKey` is given. Defaults to 0. |
| color | `ColorRole` | "primary" | nuova | The colour role of the indicator and of the selected tab. Defaults to `"primary"`. |
| fullWidth | `boolean` | true | nuova | `true` stretches the bar over the width it has and shares it equally between the tabs. `false` sizes each tab to its label, and the bar scrolls horizontally when they do not fit. Defaults to `true`. |
| height | `number \| string` |  | nuova | Overrides the height of the bar: a number of dp, or a percentage. |
| showBorders | `boolean` | false | nuova | Draws dividers between the tabs and, in the `"rounded"` variant, an outline around the track. Defaults to `false`. |
| size | `"sm" \| "md" \| "lg"` | "md" | nuova | The height and the type of the tabs. Defaults to `"md"`. |
| testID | `string` |  | nuova |  |
| variant | `"standard" \| "rounded"` | "standard" | nuova | `"standard"` is a bar with an underline under the active tab. `"rounded"` is a pill-shaped active tab on a rounded track. Defaults to `"standard"`. |
| width | `number \| string` |  | nuova | Overrides the width of the bar: a number of dp, or a percentage. |

### ThemeProvider

`packages/ui/src/providers/ThemeProvider.tsx` — prop nuove: `density`, `themeScrollbars`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| density | `Density` |  | nuova | The default `density` of every control inside (`Input`, `Select`, `Button`, `DataGrid`); a control's own `density` prop still wins. A nested provider without one inherits the outer one's. Defaults to `"normal"`. |
| initialPalette | `ThemePalette` | palettes.baseline |  | The colour set to start on — one of `palettes`, or anything `createPalette` returns. Read once, on mount: call `setPalette` from `useTheme()` to change it afterwards. |
| onInteractionFeedback | `InteractionFeedbackHandler` |  |  | Called when the user presses, toggles or selects through one of the library's controls: wire it to haptics (`@its/glowup-device/haptics`'s `hapticFeedback`) or anything else. A control opts out with `feedback={false}`. Without it a nested provider inherits the outer one's. |
| themeScrollbars | `boolean` | true | nuova | On the web, draws the browser's own scrollbars from the theme (a thin thumb in the `outline` colour, no arrows) and sets `color-scheme` to the theme's mode, so a textarea's or a list's scrollbar is not a light box in a dark page. One rule on the document, rewritten when the theme changes; a `ScrollArea` still hides its native bar. Pass `false` to leave the browser's scrollbars alone. Defaults to `true`; does nothing on iOS and Android. |

### TimePicker

`packages/ui/src/components/TimePicker.tsx` — prop nuove: `fieldVariant`, `presentation`, `showOkButton`, `showToday`, `variant`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on, `"picker"` or typed `"keyboard"` entry. There is no toggle between the two in the dialog, so this is the only way to get typed entry there. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| fieldVariant | `"outlined" \| "filled"` |  | nuova | The look of the field's box, as `variant` on `Input`: `"outlined"` is a bordered box on the surface, `"filled"` a tinted box that shows its border only while the picker is open, the typed text has focus, or there is an `error`. Named apart from `variant`, which already chooses between the field and the inline picker. Does nothing for `variant="static"`, which has no field. Defaults to `"outlined"`. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "OK", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| presentation | `DateTimePickerPresentation` |  | nuova | Web only, `variant="default"` only: whether the picker opens docked to its field or as a dialog. Decided each time it opens. Native always opens the dialog. Defaults to `"auto"`. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| showOkButton | `boolean` | true | nuova | Shows the OK button in the popup. Default `true`. Set to `false` and the picker finishes by itself instead of waiting for OK: a time is set and the popup closes once the minute is picked (`mode="datetime"`: after the day, the hour and the minute), and a date range once its second end is. A single date already closes on the tap. It has no effect on `selectionMode="multiple"`, which cannot tell when it is finished, nor on typed entry (`defaultInputType="keyboard"`), which keeps its OK; and a `variant="static"` picker has no popup, so it does nothing there. |
| showToday | `boolean` |  | nuova | Offers a "Today" button next to the month arrows. Default `true`. Only a single-date calendar has one, and it is disabled while today is outside `validRange` or excluded by `isDateDisabled`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |
| variant | `DateTimePickerVariant` |  | nuova | `"default"` shows a field that opens the picker in a popover (web) or a dialog; dismiss it by tapping outside, with the back gesture or with Escape. `"static"` draws the picker inline in the page instead: no field, no popup, no OK, and every selection calls `onChange` at once with the live value. Of the field props only `disabled` and `style` apply to a static picker, and it always shows the calendar and the clock, never typed entry. |

### ToastProvider

`packages/ui/src/providers/ToastProvider.tsx` — prop nuove: `maxVisible`, `position`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| maxVisible | `number` | 1 | nuova | How many toasts are on screen together. The others wait in the queue and appear, in order, as a slot frees. Defaults to `1`: one at a time. At a given position they stack with a gap, the newest nearest the edge. |
| position | `SnackbarPosition` | "bottom-center" | nuova | Where toasts appear unless one asks for another. Defaults to `"bottom-center"`. |

### Tooltip

`packages/ui/src/components/Tooltip.tsx` — prop nuove: `anchorAccessible`; prop cambiate: `content`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| content * | `React.ReactNode` |  | cambiata | The tip's text; the body of a rich tooltip, which can also be laid out (a small sum, a list). A node never names the anchor: give the rich tooltip a `title` for that. |
| action | `{ label: string; onPress: () => void }` |  |  | Rich only: a text button. A rich tooltip with an action stays open while the pointer is over it (web) and until the action is taken or the anchor is long-pressed again (native). |
| anchorAccessible | `boolean` | true | nuova | Native only. Whether the anchor is one accessibility element named by `content`. Turn it off when the child is a control with a name of its own (an `IconButton`): behind an accessible wrapper a screen reader never reaches the control, only the wrapper, which does nothing when activated. The long press still shows the tip. Defaults to `true`. |
| disabled | `boolean` |  |  |  |
| enterDelay | `number` | 500 |  | Hover dwell (ms) before the tip appears on web. Without it, sweeping the pointer across a toolbar flashes every tooltip in the row. |
| hideDelay | `number` | 1500 |  | Auto-hide delay (ms) after long-press on native. |
| leaveDelay | `number` | 100 |  | Grace period (ms) before the tip leaves on hover-out. |
| position | `"top" \| "bottom" \| "left" \| "right"` | "top" |  |  |
| title | `string` |  |  | Rich only: the subhead. |
| variant | `"plain" \| "rich"` | "plain" |  | `"plain"` is the one-line label for an icon-only control. `"rich"` adds a `title` and an `action`, for context a label cannot carry. Defaults to `"plain"`. |

### Typography

`packages/ui/src/components/Typography.tsx` — prop nuove: `align`, `color`, `fontSize`, `nowrap`, `onClick`; prop cambiate: `variant`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| align | `"left" \| "center" \| "right" \| "justify"` |  | nuova | Horizontal alignment of the text within its box. |
| color | `keyof ThemeColorTokens \| (string & {})` |  | nuova | A theme colour token (`"primary"`, `"onSurfaceVariant"`, `"error"`, …) or, failing that, any colour string. Defaults to `onSurface`. |
| fontSize | `number` |  | nuova | Overrides the size of the variant; the line height scales with it. |
| nowrap | `boolean` | false | nuova | Keeps the text on one line, ending it with an ellipsis when it is cut. |
| onClick | `TextProps["onPress"]` |  | nuova | Makes the text pressable. |
| variant | `TypographyName \| TypographyVariant` | "body1" | cambiata | Type-scale name: `h1`–`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`. The M3 role names (`displayLarge`, `bodyMedium`, …) still work and name the same styles. Defaults to `"body1"`. |

### VStack

`packages/ui/src/components/Layout/Stack.tsx` — prop nuove: `background`, `children`, `dividers`, `margin`, `padding`, `style`; prop cambiate: `spacing`; prop tolte: `bg`, `flex`, `m`, `mb`, `ml`, `mr`, `mt`, `mx`, `my`, `p`, `pb`, `pl`, `pr`, `pt`, `px`, `py`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| background | `ColorValue` |  | nuova | Background — a theme colour token (`"surfaceContainer"`) or any colour string. |
| borderColor | `ColorValue` |  |  | Border colour — a theme colour token or any colour string. |
| borderWidth | `number` |  |  |  |
| children | `React.ReactNode` |  | nuova |  |
| dividers | `React.ReactNode` |  | nuova | Puts a divider between the children. `true` draws a hairline, vertical in a horizontal stack; a node is used as the divider instead. Empty children (`null`, `false`) get none, and the spacing applies on both sides of it. |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| margin | `number` |  | nuova | Margin on every edge, in px. One edge or one axis goes through `style`. |
| padding | `number` |  | nuova | Padding on every edge, in px. One edge or one axis goes through `style`. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingInput` |  | cambiata | Space between children — a spacing token name (`"m"`), a number of px, or a string holding one (`"12"`). |
| style | `StyleProp<ViewStyle>` |  | nuova | Merged last, over the variant and every other prop. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  | Lets children flow onto the next line (or column) instead of overflowing. |

# Componenti tenuti

### AlertProvider

`packages/ui/src/providers/AlertProvider.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |

### AlertProviderWrapper

`packages/ui/src/providers/AlertProvider.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |

### Breadcrumbs

`packages/ui/src/components/Breadcrumbs.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| items * | `BreadcrumbItem[]` |  |  |  |
| maxItems | `number` |  |  | Collapse middle items behind an ellipsis when exceeding this count. |
| separator | `MaterialCommunityIconsGlyphs` | "chevron-right" |  |  |

### ButtonGroup

`packages/ui/src/components/ButtonGroup.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: any) => void` |  |  |  |
| options * | `ButtonGroupOption[]` |  |  |  |
| value * | `string \| string[]` |  |  | The selected value, or the selected values with `multiSelect`. |
| accessibilityLabel | `string` |  |  | Names the group for assistive tech. |
| mode | `"tonal" \| "outlined"` | "tonal" |  | Look of the unselected buttons; selected ones are filled. Defaults to `"tonal"`. |
| multiSelect | `boolean` | false |  |  |
| size | `keyof typeof HEIGHTS` | "s" |  | Defaults to `"s"` (40dp). |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| type | `"standard" \| "connected"` | "standard" |  | `"standard"` spaces the buttons apart; `"connected"` joins them into one control (the successor of segmented buttons). Defaults to `"standard"`. |

### CardActions

`packages/ui/src/components/CardParts/CardActions.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| align | `"start" \| "end" \| "space-between"` | "end" |  | Where the buttons sit on the row. M3 puts card actions on the right. |
| style | `StyleProp<ViewStyle>` |  |  |  |

### CardContent

`packages/ui/src/components/CardParts/CardContent.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### CardCover

`packages/ui/src/components/CardParts/CardCover.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| alt * | `string` |  |  | Alternative text — an unnamed image is invisible to a screen reader. |
| source * | `ImageSourcePropType` |  |  |  |
| ratio | `number` | 16 / 9 |  | Width divided by height. M3 card covers default to 16:9. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Carousel

`packages/ui/src/components/Carousel.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| autoPlayInterval | `number` | 0 |  | Auto-advance interval in ms; 0 disables auto-play. |
| height | `number` |  |  | Fixed height; otherwise sized by the tallest page. |
| onIndexChange | `(index: number) => void` |  |  |  |
| showArrows | `boolean` | false |  | Overlay prev/next arrow buttons. |
| showDots | `boolean` | true |  |  |

### Checkbox

`packages/ui/src/components/Checkbox.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| checked * | `boolean` |  |  |  |
| onValueChange * | `(value: boolean) => void` |  |  |  |
| disabled | `boolean` |  |  |  |
| error | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report the toggle to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| indeterminate | `boolean` |  |  | Mixed state (e.g. "select all" with partial selection); overrides the checkmark. |
| label | `string` |  |  |  |
| labelPosition | `"left" \| "right"` | "right" |  |  |

### Collapse

`packages/ui/src/components/Collapse.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| open * | `boolean` |  |  | Whether the content is expanded. |
| animateOpacity | `boolean` | true |  | Fades the content along with the height change. Defaults to `true`. |
| collapsedHeight | `number` | 0 |  | Height kept visible while collapsed — a peek/teaser. Defaults to 0. |
| duration | `number` | 200 |  | Transition length in ms. Defaults to 200. |
| keepMounted | `boolean` | false |  | Skips unmounting the children while collapsed. Defaults to `false`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Divider

`packages/ui/src/components/Divider.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children | `React.ReactNode` |  |  | Centred label, splitting the rule in two. Horizontal only — a vertical divider is a bare rule. |
| contentSpacing | `number` | 16 |  | Gap between the label and each half of the rule. No label, no gap. |
| inset | `number` | 0 |  | Margin at both ends of the line, along its own axis. |
| orientation | `"horizontal" \| "vertical"` | "horizontal" |  |  |
| style | `ViewStyle` |  |  |  |
| thickness | `number` | 1 |  | Line thickness, in pixels. |

### EmptyState

`packages/ui/src/components/EmptyState.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| title * | `string` |  |  |  |
| action | `EmptyStateAction` |  |  |  |
| description | `string` |  |  |  |
| icon | `MaterialCommunityIconsGlyphs` | "inbox-outline" |  |  |

### FormControl

`packages/ui/src/components/FormControl.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| disabled | `boolean` | false |  |  |
| error | `string` |  |  | Error text below the control. Its presence marks the group invalid. |
| helperText | `string` |  |  | Supporting text below the control; hidden while `error` is set. |
| label | `string` |  |  |  |
| required | `boolean` | false |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### HelperText

`packages/ui/src/components/HelperText.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| containerStyle | `StyleProp<ViewStyle>` |  |  |  |
| disabled | `boolean` | false |  | Dims the text to match a disabled field. |
| padding | `"normal" \| "none"` | "normal" |  | `none` removes the 16px gutter that aligns the text with the field body. |
| style | `StyleProp<TextStyle>` |  |  |  |
| testID | `string` |  |  |  |
| type | `HelperTextType` | "info" |  | `error` switches to the error role and shows the alert glyph. |
| visible | `boolean` | true |  | Fades the text out instead of unmounting it, so the field doesn't jump. |

### Icon

`packages/ui/src/components/Icon.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| source * | `IconSource` |  |  |  |
| color | `string` |  |  |  |
| flipForRTL | `boolean` | false |  | Mirror the glyph when the layout direction is RTL (arrows, chevrons). |
| size | `number` | 24 |  |  |
| style | `StyleProp<ImageStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Image

`packages/ui/src/components/Image.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| alt * | `string` |  |  | Alternative text. Required — an image with no accessible name is invisible to screen readers. |
| source * | `ImageSourcePropType` |  |  |  |
| fallbackIcon | `MaterialCommunityIconsGlyphs` | "image-broken-variant" |  | Shown when loading fails and there is no `fallbackSource`. |
| fallbackSource | `ImageSourcePropType` |  |  | Swapped in when `source` fails to load. |
| height | `DimensionValue` |  |  |  |
| onError | `() => void` |  |  |  |
| onLoad | `() => void` |  |  |  |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| ratio | `number` |  |  | Width divided by height. Use instead of `height` for fluid layouts. |
| resizeMode | `ImageResizeMode` | "cover" |  |  |
| showLoader | `boolean` | true |  | Renders a pulsing skeleton until the image resolves. Defaults to `true`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| width | `DimensionValue` |  |  |  |

### Link

`packages/ui/src/components/Link.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `string` |  |  |  |
| accessibilityLabel | `string` |  |  |  |
| allowedSchemes | `string[]` | DEFAULT_SCHEMES |  | URL schemes `href` may use. A link whose `href` came from data (a user's website, a CMS field) must not be able to open `javascript:`, `intent:` or another app's deep link. Add your own app's scheme here to deep-link. Defaults to `["http", "https", "mailto", "tel"]`. |
| color | `string` |  |  |  |
| disabled | `boolean` |  |  |  |
| externalIcon | `MaterialCommunityIconsGlyphs` | "open-in-new" |  |  |
| href | `string` |  |  | Opened with `Linking.openURL`. Ignored when `onPress` is given, and when its scheme is not in `allowedSchemes` — then the link does nothing. |
| onPress | `() => void` |  |  |  |
| showExternalIcon | `boolean` |  |  | Appends an external-link icon. Defaults to `true` when `href` is an `http` or `https` address. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| textStyle | `StyleProp<TextStyle>` |  |  |  |
| underline | `"always" \| "hover" \| "none"` | "hover" |  | Underline behaviour. Defaults to `"hover"`. |
| variant | `keyof Theme["typography"]` | "bodyMedium" |  | M3 typography variant for the label. Defaults to `"bodyMedium"`. |

### ListSubheader

`packages/ui/src/components/List/ListSubheader.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| style | `StyleProp<TextStyle>` |  |  |  |

### Paper

`packages/ui/src/components/Paper.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| elevation | `number` | 1 |  |  |
| glow | `boolean` | false |  |  |
| outline | `boolean` | false |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### Portal

`packages/ui/src/components/Portal.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |

### PortalHost

`packages/ui/src/components/Portal.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |

### RadioButton

`packages/ui/src/components/RadioButton.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onPress * | `() => void` |  |  |  |
| selected * | `boolean` |  |  |  |
| disabled | `boolean` |  |  |  |
| error | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report the selection to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| label | `string` |  |  |  |
| labelPosition | `"left" \| "right"` | "right" |  |  |

### RadioGroup

`packages/ui/src/components/RadioButton.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: any) => void` |  |  |  |
| options * | `RadioOption[]` |  |  |  |
| value * | `any` |  |  |  |
| direction | `"column" \| "row"` | "column" |  |  |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| feedback | `boolean` | true |  | Report each selection to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| label | `string` |  |  |  |

### Skeleton

`packages/ui/src/components/Skeleton.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| animate | `boolean` | true |  | false renders a static placeholder (no pulse). |
| borderRadius | `number` |  |  |  |
| duration | `number` | 1200 |  | Pulse animation duration for a full cycle (ms). |
| height | `DimensionValue` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| variant | `SkeletonVariant` | "rect" |  |  |
| width | `DimensionValue` |  |  |  |

### Spacer

`packages/ui/src/components/Layout/Spacer.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| axis | `"vertical" \| "horizontal"` | "vertical" |  | Which axis `size` applies to. Defaults to `"vertical"`. |
| size | `SpacingValue` |  |  | Fixed size along the parent's axis. Omit to absorb the leftover space. |

### SpeedDial

`packages/ui/src/components/SpeedDial.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| actions * | `SpeedDialAction[]` |  |  |  |
| mainIcon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| defaultOpen | `boolean` | false |  | Mount with the action stack already expanded. Uncontrolled after that. |
| position | `SpeedDialPosition` | "bottom-right" |  |  |

### SplitButton

`packages/ui/src/components/SplitButton.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `string` |  |  | The primary action's label. |
| items * | `MenuItem[]` |  |  | The related actions the trailing half opens. |
| onPress * | `() => void` |  |  | The primary action. |
| disabled | `boolean` | false |  |  |
| iconName | `MaterialCommunityIconsGlyphs` |  |  | Leading icon of the primary action. |
| menuAccessibilityLabel | `string` | "More options" |  | Accessible name of the trailing half. Defaults to `"More options"`. |
| mode | `"filled" \| "tonal" \| "outlined"` | "filled" |  | Defaults to `"filled"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### TabContent

`packages/ui/src/components/Tab/TabContent.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeTab * | `number` |  |  |  |
| children * | `React.ReactNode` |  |  |  |
| style | `object` | {} |  |  |

### TableHead

`packages/ui/src/components/Table.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### ToggleButton

`packages/ui/src/components/ToggleButton/ToggleButton.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| active * | `boolean` |  |  |  |
| onPress * | `() => void` |  |  |  |
| accessibilityRole | `"radio" \| "checkbox" \| "button"` | "button" |  | Accessibility role. The group sets this per its selection mode. |
| disabled | `boolean` | false |  |  |
| grow | `boolean` | false |  | Stretch to an equal share of the group's width. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| isFirst | `boolean` |  |  |  |
| isLast | `boolean` |  |  |  |
| label | `string` |  |  |  |
| showSelectedCheck | `boolean` | false |  | Swap the leading glyph for a check mark while selected — the M3 segmented button affordance that tells "selected" apart from "just highlighted". |
| style | `StyleProp<ViewStyle>` |  |  |  |

### ToggleButtonGroup

`packages/ui/src/components/ToggleButton/ToggleButtonGroup.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(val: any) => void` |  |  |  |
| options * | `ToggleButtonOption[]` |  |  |  |
| value * | `string \| string[]` |  |  |  |
| accessibilityLabel | `string` |  |  | Names the group for assistive tech — a group of choices needs a question. |
| disabled | `boolean` | false |  | Disables every segment. |
| feedback | `boolean` | true |  | Report each press (a toggle with `multiSelect`, else a selection) to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| fullWidth | `boolean` | false |  | Segments share the row equally instead of sizing to their labels. |
| multiSelect | `boolean` | false |  |  |
| showSelectedCheck | `boolean` | false |  | Show a check mark on the selected segments (M3 segmented button). |
| style | `StyleProp<ViewStyle>` |  |  |  |

### Toolbar

`packages/ui/src/components/Toolbar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  | The actions: `IconButton`s, a `Button`, a `SplitButton`. |
| accessibilityLabel | `string` |  |  | Names the toolbar for assistive tech. |
| color | `"standard" \| "vibrant"` | "standard" |  | Floating only. `"standard"` is `surfaceContainer`; `"vibrant"` is `primaryContainer` — give its actions `onPrimaryContainer` content. Defaults to `"standard"`. |
| fab | `React.ReactNode` |  |  | Floating only: a FAB beside the toolbar, as M3 pairs them. |
| orientation | `"horizontal" \| "vertical"` | "horizontal" |  | Floating only. Defaults to `"horizontal"`. |
| safeArea | `boolean` | true |  | Docked only: pads the bottom safe-area inset. Defaults to `true`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| variant | `"docked" \| "floating"` | "docked" |  | `"docked"` spans the width of the screen's bottom edge (it replaces the bottom app bar); `"floating"` is a pill that floats over the content. Defaults to `"docked"`. |

### TouchableRipple

`packages/ui/src/components/TouchableRipple.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| activeStyle | `StyleProp<ViewStyle>` |  |  | Extra style applied only while hovered (web) or pressed. |
| borderless | `boolean` | false |  | Skip the container background so the layer only tints the child. |
| borderRadius | `number` |  |  | Matches the parent's corner radius so the layer doesn't bleed out. |
| rippleColor | `string` |  |  | Colour of the state layer itself — the M3 "on" role of the surface. Defaults to `onSurface`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| underlayColor | `string` |  |  | Surface the state layer is drawn over. Defaults to `surface`. |

