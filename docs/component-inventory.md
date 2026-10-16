# Inventario dei componenti di `@its/glowup-ui`

File **generato** da `npm run docgen -w @its/glowup-playground && npm run inventory -w @its/glowup-playground`: non si modifica a mano
(salvo l'elenco "Altre aggiunte", che sta nello script `apps/playground/docgen/inventory.mjs`). Confronto con il commit `14a148f`,
prima della prima modifica della libreria di questo lavoro (versione 0.11.1, 102 componenti).
Ora: versione 0.11.1, 103 componenti.

Legenda: `*` accanto al nome = prop obbligatoria. «nuova» = non c'era all'inizio; «cambiata» = tipo, obbligatorietà o default diversi.

## Riepilogo

| Stato | Componenti | Prop in totale |
| ----- | ---------- | -------------- |
| Aggiunti | 1 | 15 |
| Aggiornati | 17 | 207 |
| Tenuti (invariati) | 85 | 756 |

## Aggiunti

- [CaptionValue](#captionvalue)

## Aggiornati

- [Autocomplete](#autocomplete): comportamento · + allowCustomValue, debounceMs, onSearch, onSelectedChange, selected · ~ filter
- [Banner](#banner): comportamento
- [BottomSheet](#bottomsheet): comportamento · + actions, showCloseButton
- [Button](#button): comportamento · + badge, density
- [Chip](#chip): + toneFrom
- [DataGrid](#datagrid): comportamento · + emptyState · ~ density, rowStyle
- [IconButton](#iconbutton): + badge
- [Input](#input): comportamento · + allUpperCase, decimalSeparator, density, reserveHelperText · ~ minHeight
- [ListItem](#listitem): comportamento · + dimmed, indicatorColor, trailingWidth
- [Modal](#modal): + size
- [Select](#select): comportamento · + density
- [Snackbar](#snackbar): comportamento · ~ type
- [StatusBadge](#statusbadge): + toneFrom
- [TableCell](#tablecell): + align
- [TableHeaderCell](#tableheadercell): comportamento · + align
- [Tabs](#tabs): comportamento · + activeKey · ~ onChange, tabs, activeTab
- [ThemeProvider](#themeprovider): + density

## Tenuti

[Accordion](#accordion) · [AlertProvider](#alertprovider) · [AlertProviderWrapper](#alertproviderwrapper) · [AnimatedFAB](#animatedfab) · [AppBar](#appbar) · [AspectRatio](#aspectratio) · [Avatar](#avatar) · [Badge](#badge) · [Box](#box) · [Breadcrumbs](#breadcrumbs) · [ButtonGroup](#buttongroup) · [Calendar](#calendar) · [Card](#card) · [CardActions](#cardactions) · [CardContent](#cardcontent) · [CardCover](#cardcover) · [CardTitle](#cardtitle) · [Carousel](#carousel) · [Center](#center) · [Checkbox](#checkbox) · [ChipGroup](#chipgroup) · [CircularProgress](#circularprogress) · [ClockDial](#clockdial) · [ClockPicker](#clockpicker) · [Collapse](#collapse) · [ConfirmDialog](#confirmdialog) · [DatePicker](#datepicker) · [DatePickerInput](#datepickerinput) · [DateRangePicker](#daterangepicker) · [DateTimePicker](#datetimepicker) · [Divider](#divider) · [DrawerItem](#draweritem) · [DrawerSection](#drawersection) · [EmptyState](#emptystate) · [FAB](#fab) · [FormControl](#formcontrol) · [Grid](#grid) · [HelperText](#helpertext) · [HStack](#hstack) · [Icon](#icon) · [Image](#image) · [LinearProgress](#linearprogress) · [Link](#link) · [ListSection](#listsection) · [ListSubheader](#listsubheader) · [Menu](#menu) · [NavigationBar](#navigationbar) · [NavigationDrawer](#navigationdrawer) · [NavigationRail](#navigationrail) · [Pagination](#pagination) · [Paper](#paper) · [PinInput](#pininput) · [Popover](#popover) · [Portal](#portal) · [PortalHost](#portalhost) · [ProgressButton](#progressbutton) · [RadioButton](#radiobutton) · [RadioGroup](#radiogroup) · [Rating](#rating) · [SearchBar](#searchbar) · [SideSheet](#sidesheet) · [Skeleton](#skeleton) · [Slider](#slider) · [Spacer](#spacer) · [SpeedDial](#speeddial) · [Spinner](#spinner) · [SplitButton](#splitbutton) · [Stack](#stack) · [Stat](#stat) · [Stepper](#stepper) · [TabContent](#tabcontent) · [Table](#table) · [TableHead](#tablehead) · [TableRow](#tablerow) · [TimePicker](#timepicker) · [ToastProvider](#toastprovider) · [Toggle](#toggle) · [ToggleButton](#togglebutton) · [ToggleButtonGroup](#togglebuttongroup) · [Toolbar](#toolbar) · [Tooltip](#tooltip) · [TopAppBar](#topappbar) · [TouchableRipple](#touchableripple) · [Typography](#typography) · [VStack](#vstack)

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
| Tipo | `TableAlign` (`left`, `center`, `right`), `TabItem` (`label`, `icon?`, `key?`, `disabled?`), `SnackbarType` (aggiunti `warning`, `info`) | Fase 3 |
| Sotto-tipo | `DataGrid` `columns[]` (`ColumnDefinition`): nuove `align`, `renderCell(value, row, index)` | Fase 3, lotto 3A |
| Sotto-tipo | `Tabs` `tabs[]`: oggetti con `key` e `disabled` (oltre a `label` e `icon`) | Fase 3, lotto 3B |
| Sotto-tipo | `useToast()`: nuovi `warning(message, options?)` e `info(message, options?)` | Fase 3, lotto 3B |

---

# Componenti aggiunti

### CaptionValue

`packages/ui/src/components/CaptionValue.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| caption | `React.ReactNode` |  |  | The label: "Phone", "Due date". Text, or any node. |
| captionColor | `string` |  |  | Any colour; defaults to the variant-on-surface role. |
| captionStyle | `StyleProp<TextStyle>` |  |  |  |
| direction | `"column" \| "row"` | "column" |  | `"column"` stacks the caption over the value, `"row"` puts them side by side. |
| fallback | `React.ReactNode` | "—" |  | Drawn when `value` is empty (`null`, `undefined`, `""` or `false`; `0` is a value). Defaults to an em dash. |
| gap | `number` | 4 |  | Space between the caption and the value. Defaults to 4. |
| numberOfLines | `number` | 1 |  | Lines the value may use before it is cut with an ellipsis; `0` is no limit. Defaults to 1. |
| omitCaption | `boolean` | false |  | Draws no caption at all, instead of an empty line. |
| reverse | `boolean` | false |  | Puts the value before the caption. |
| style | `StyleProp<ViewStyle>` |  |  | For width, flex, padding and the like. |
| testID | `string` |  |  |  |
| textAlign | `TextStyle["textAlign"]` |  |  |  |
| value | `React.ReactNode` |  |  | The value. Text and numbers are drawn in the theme's type; any other node as given. |
| valueColor | `string` |  |  | Any colour; defaults to the on-surface role. |
| valueStyle | `StyleProp<TextStyle>` |  |  |  |

# Componenti aggiornati

### Autocomplete

`packages/ui/src/components/Autocomplete.tsx` — comportamento: `onSearch` toglie il filtro per etichetta; `allowCustomValue={false}` ripristina o svuota all'uscita dal campo; prop nuove: `allowCustomValue`, `debounceMs`, `onSearch`, `onSelectedChange`, `selected`; prop cambiate: `filter`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChangeText * | `(text: string) => void` |  |  |  |
| onSelect * | `(option: AutocompleteOption) => void` |  |  |  |
| options * | `AutocompleteOption[]` |  |  |  |
| value * | `string` |  |  | The text in the field. Free text is allowed — this is not a Select. |
| allowCustomValue | `boolean` | true | nuova | Whether text that is not an option may stay in the field. Defaults to `true`. With `false`, leaving the field puts back the chosen option's label, or empties it when nothing is chosen. |
| clearable | `boolean` | true |  | Adds a clear button once there is text. Defaults to `true`. |
| clearAccessibilityLabel | `string` |  |  |  |
| debounceMs | `number` | 300 | nuova | Quiet time before `onSearch`. Defaults to 300. |
| disabled | `boolean` |  |  |  |
| emptyMessage | `string` |  |  | Shown when nothing matches. Omit to hide the list instead. |
| error | `string` |  |  |  |
| filter | `(option: AutocompleteOption, query: string) => boolean` |  | cambiata | Custom matcher. Defaults to a case- and accent-insensitive substring test over `label`, or to no filtering at all when `onSearch` is given (the server already filtered). |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| label | `string` |  |  |  |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| loading | `boolean` |  |  | Shows a spinner in the field — for options still being fetched. |
| maxSuggestions | `number` | 8 |  | Caps the visible suggestions. Defaults to 8. |
| minChars | `number` | 1 |  | Characters required before suggestions appear. Defaults to 1. |
| onSearch | `(text: string) => void` |  | nuova | Called with the text after the user stops typing for `debounceMs`, once it has `minChars` characters, and with `""` when the field is cleared. Fetch the options there and pass them in `options`; use `loading` meanwhile. Not called for the text an option fills in. |
| onSelectedChange | `(option: AutocompleteOption \| null) => void` |  | nuova |  |
| placeholder | `string` |  |  |  |
| required | `boolean` |  |  |  |
| selected | `AutocompleteOption \| null` |  | nuova | The chosen option, kept apart from the text being typed. Pass it (even as `null`) to control the choice; editing the text away from its label, or clearing the field, reports `null` through `onSelectedChange`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

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

`packages/ui/src/components/BottomSheet.tsx` — comportamento: il contenuto scorre da solo; l'intestazione ha un ruolo `header`; prop nuove: `actions`, `showCloseButton`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| onDismiss * | `() => void` |  |  |  |
| visible * | `boolean` |  |  |  |
| actions | `React.ReactNode` |  | nuova | A row of buttons fixed at the bottom, below a divider, while the content above it scrolls (named like `SideSheet`'s and `Modal`'s `actions`). |
| dismissOnScrimTap | `boolean` | true |  |  |
| maxHeightRatio | `number` | 0.85 |  | Max sheet height as a fraction of the window height. |
| showCloseButton | `boolean` | false | nuova | Adds a close button at the end of the title row. Defaults to `false`. |
| showHandle | `boolean` | true |  |  |
| title | `string` |  |  |  |

### Button

`packages/ui/src/components/Button.tsx` — comportamento: `tone="success"` legge i ruoli `success` del tema; prop nuove: `badge`, `density`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityHint | `string` |  |  |  |
| accessibilityLabel | `string` |  |  |  |
| badge | `number` |  | nuova | A count shown after the label (a `Badge`): active filters, unread items. Hidden at 0 or when left out. |
| busy | `boolean` | false |  | Blocks presses and announces the button as busy, but — unlike `loading` — keeps the label, the icon and the full-strength colours on screen. |
| children | `React.ReactNode` |  |  |  |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: about 36 px instead of 48. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| fullWidth | `boolean` | false |  | Stretch to fill the parent width. |
| iconName | `MaterialCommunityIconsGlyphs` |  |  |  |
| iconPosition | `"left" \| "right"` | "left" |  | Icon side relative to the label. |
| iconStyle | `object` | {} |  |  |
| labelStyle | `StyleProp<TextStyle>` |  |  | Applied to the label text, after the theme's type style. |
| loading | `boolean` | false |  |  |
| mode | `ButtonMode` | "filled" |  |  |
| onPress | `() => void` |  |  |  |
| size | `number` |  |  |  |
| style | `object` | {} |  |  |
| testID | `string` |  |  |  |
| tone | `ButtonTone` | "primary" |  | Colour role. `error` is the destructive treatment (delete, discard); `success` is confirmation feedback, from a fixed green kept off the seed. |
| underlay | `React.ReactNode` |  |  | Drawn behind the label across the whole surface, clipped to its shape: a progress fill, a state animation. It receives no touches. |

### Chip

`packages/ui/src/components/Chip.tsx` — prop nuove: `toneFrom`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| accessibilityRole | `"button" \| "radio" \| "checkbox"` |  |  | Overrides the role of a pressable chip (`"button"`). A chip that toggles inside a group is a `"radio"` or a `"checkbox"`, and then reports `selected` as checked. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report presses: a `"checkbox"` chip toggles, a `"radio"` one selects to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| mode | `"filled" \| "tonal" \| "outlined"` | "filled" |  |  |
| onClose | `() => void` |  |  |  |
| onPress | `() => void` |  |  |  |
| selected | `boolean` | false |  |  |
| size | `"small" \| "medium"` | "medium" |  | "small" renders a compact 24px chip. |
| style | `object` | {} |  |  |
| toneFrom | `string` |  | nuova | Tints a `"filled"` or `"tonal"` chip from a `#RRGGBB` colour or from any text (the same text always gives the same colour), readable in light and dark. |

### DataGrid

`packages/ui/src/components/DataGrid.tsx` — comportamento: segue `ThemeProvider density`; `columns[]` ha `align` e `renderCell`; prop nuove: `emptyState`; prop cambiate: `density`, `rowStyle`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| columns * | `ColumnDefinition[]` |  |  |  |
| data * | `any[]` |  |  |  |
| density | `Density` |  | cambiata | Row height; follows `ThemeProvider`'s `density` unless set here. |
| emptyMessage | `string` |  |  | Shown centered when data is empty and not loading. |
| emptyState | `ReactNode` |  | nuova | Drawn instead of `emptyMessage` when data is empty and not loading: an illustration, a call to action. |
| headerStyle | `ViewStyle` |  |  |  |
| loading | `boolean` | false |  |  |
| onColumnReorder | `(newColumns: ColumnDefinition[]) => void` |  |  |  |
| onEndReached | `() => void` |  |  |  |
| onEndReachedThreshold | `number` | 0.5 |  |  |
| onSort | `(columnId: string, direction: "asc" \| "desc") => void` |  |  |  |
| rowStyle | `ViewStyle \| ((row: any, index: number) => ViewStyle \| undefined)` |  | cambiata | One style for every row, or a function of the row (to dim or highlight one). |
| sortColumn | `string` |  |  |  |
| sortDirection | `"asc" \| "desc"` |  |  |  |
| style | `ViewStyle` |  |  |  |

### IconButton

`packages/ui/src/components/IconButton.tsx` — prop nuove: `badge`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityLabel * | `string` |  |  | Required: an icon alone carries no accessible name. |
| icon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| badge | `number` |  | nuova | A count on the top-right corner (a `Badge`). Hidden at 0 or when left out. |
| disabled | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report the press (a toggle when `selected` is set) to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| loading | `boolean` |  |  |  |
| mode | `IconButtonMode` | "standard" |  | M3 icon-button container styles. Defaults to `"standard"`. |
| onPress | `() => void` |  |  |  |
| selected | `boolean` |  |  | Renders the M3 "selected" container of a toggle icon button. |
| size | `IconButtonSize` | "medium" |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Input

`packages/ui/src/components/Input.tsx` — comportamento: segue `ThemeProvider density`; `decimalSeparator` cambia come si scrive e si vede il numero, non il valore consegnato; prop nuove: `allUpperCase`, `decimalSeparator`, `density`, `reserveHelperText`; prop cambiate: `minHeight`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChangeText * | `(text: string) => void` |  |  |  |
| value * | `string` |  |  |  |
| allUpperCase | `boolean` | false | nuova | Capitalises what is typed (codes, plates, tax ids). Not for `type="number"`. |
| decimalSeparator | `"." \| ","` | "." | nuova | The decimal mark a `type="number"` field types and shows: `","` for a user who writes 12,50. `value` and `onChangeText` stay in the plain form ("12.50"), so the app parses nothing; a typed "." is then ignored, as a thousands mark. Defaults to `"."`. |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 56, 14 px text, less space below. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| label | `string` |  |  |  |
| leadingIcon | `MaterialCommunityIconsGlyphs` |  |  |  |
| maxLength | `number` |  |  |  |
| minHeight | `number` |  | cambiata | Overrides the height `density` gives (56, or 40 when dense). |
| multiline | `boolean` | false |  |  |
| numberOfLines | `number` | 4 |  |  |
| onBlur | `() => void` |  |  |  |
| onFocus | `() => void` |  |  |  |
| onTrailingIconPress | `() => void` |  |  |  |
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
| variant | `"outlined" \| "filled"` | "outlined" |  |  |

### ListItem

`packages/ui/src/components/List/ListItem.tsx` — comportamento: `children` e `secondary` accettano un nodo; solo il testo viene avvolto in `Text`; prop nuove: `dimmed`, `indicatorColor`, `trailingWidth`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  | The first line. Text is drawn in the theme's type; any other node is drawn as given. |
| dimmed | `boolean` | false | nuova | Faded, for a row that is removed or inactive. Still pressable. |
| indicatorColor | `string` |  | nuova | A coloured bar on the left edge, for a status or a priority. |
| itemContainerStyle | `object` |  |  |  |
| itemHoveredStyle | `object` |  |  |  |
| itemPressedStyle | `object` |  |  |  |
| itemSecondaryTextStyle | `object` |  |  |  |
| itemTextStyle | `object` |  |  |  |
| leading | `React.ReactNode` |  |  | Leading slot — an Avatar, an icon, a Checkbox. |
| onPress | `() => void` |  |  |  |
| secondary | `React.ReactNode` |  |  | Second line below `children`. Text or any node, like `children`. |
| trailing | `React.ReactNode` |  |  | Trailing slot — a value, a Toggle, a chevron. |
| trailingWidth | `number` |  | nuova | Fixes the width of the trailing slot and right-aligns it, so a column of rows lines its trailing values up. |

### Modal

`packages/ui/src/components/Modal/Modal.tsx` — prop nuove: `size`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode \| string` |  |  |  |
| visible * | `boolean` |  |  | Whether the dialog is on screen. |
| actions | `React.ReactNode` |  |  | Trailing action row. Replaces the single `closeText` button. In a full-screen dialog it moves into the header, after the title. |
| animationType | `"none" \| "slide" \| "fade"` | "fade" |  |  |
| closeText | `string` | "Close" |  |  |
| dismissable | `boolean` | true |  | Whether tapping the scrim (and pressing ESC on web) dismisses the dialog. Turn it off for a decision the user must not be able to skip. Defaults to `true`. |
| fullScreen | `boolean` | false |  | The M3 full-screen dialog, for a form on a compact window: it fills the window, with a close button, the title and `actions` in a header row and a scrolling body. Defaults to `false`. |
| icon | `IconSource` |  |  | Hero glyph above the title (M3 dialog icon). Centres the header. |
| onClose | `() => void` |  |  |  |
| onDismiss | `() => void` |  |  | Called on Android back / ESC without rendering the close button. Falls back to onClose. |
| scrollable | `boolean` | false |  | Scrolls the body when the content is taller than the dialog. |
| size | `keyof typeof MAX_WIDTHS` | "md" | nuova | How wide the dialog may grow on a wide window: `"xs"` 360, `"sm"` 480, `"md"` 560, `"lg"` 800. Defaults to `"md"`, the width it always had. Ignored by `fullScreen`. |
| testID | `string` | "modal" |  | Root testID. The scrim gets `${testID}-scrim`. |
| title | `string` |  |  |  |
| transparent | `boolean` | true |  |  |

### Select

`packages/ui/src/components/Select.tsx` — comportamento: segue `ThemeProvider density`; prop nuove: `density`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onSelect * | `(value: any) => void` |  |  |  |
| options * | `Option[]` |  |  |  |
| value * | `any` |  |  |  |
| defaultOpen | `boolean` | false |  | Mount with the option list already open. Uncontrolled after that. |
| density | `Density` |  | nuova | Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 52, 14 px text, less space below. |
| disabled | `boolean` |  |  |  |
| error | `string` |  |  |  |
| label | `string` |  |  |  |
| multiSelect | `boolean` | false |  |  |
| optionStyle | `object` |  |  |  |
| placeholder | `string` | "Select an option" |  |  |
| selectedValues | `any[]` | [] |  |  |
| showAsChips | `boolean` | false |  |  |
| style | `object` |  |  |  |
| toggleOptions | `(value: any) => void` |  |  |  |
| variant | `SelectVariant` | "outlined" |  |  |

### Snackbar

`packages/ui/src/components/Snackbar.tsx` — comportamento: `success` usa i ruoli del tema; icone per `warning` e `info`; prop cambiate: `type`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| message * | `string` |  |  |  |
| onDismiss * | `() => void` |  |  |  |
| visible * | `boolean` |  |  |  |
| action | `{ label: string; onPress: () => void; }` |  |  |  |
| duration | `number` | 4000 |  |  |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| type | `SnackbarType` | "default" | cambiata |  |

### StatusBadge

`packages/ui/src/components/StatusBadge.tsx` — prop nuove: `toneFrom`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| icon | `string` |  |  |  |
| toneFrom | `string` |  | nuova | Tints the badge from a `#RRGGBB` colour or from any text instead of from `type`, which still picks the default icon. |
| type | `"success" \| "error" \| "warning"` | "success" |  |  |

### TableCell

`packages/ui/src/components/Table.tsx` — prop nuove: `align`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| align | `TableAlign` | "left" | nuova |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| textStyle | `StyleProp<TextStyle>` |  |  |  |
| width | `number` |  |  |  |

### TableHeaderCell

`packages/ui/src/components/Table.tsx` — comportamento: il padding a destra c'è solo con le frecce di riordino; prop nuove: `align`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| align | `TableAlign` | "left" | nuova |  |
| onMoveLeft | `() => void` |  |  |  |
| onMoveRight | `() => void` |  |  |  |
| onPress | `() => void` |  |  |  |
| sortable | `boolean` |  |  |  |
| sortDirection | `"asc" \| "desc" \| null` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| width | `number` |  |  |  |

### Tabs

`packages/ui/src/components/Tab/Tabs.tsx` — comportamento: `tabs[]` può essere un oggetto `TabItem` con `key`, `disabled`, `icon` opzionale; prop nuove: `activeKey`; prop cambiate: `onChange`, `tabs`, `activeTab`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(index: number, key?: string) => void` |  | cambiata | Called with the pressed tab's position and, when it has one, its `key`. |
| tabs * | `TabItem[] \| string[]` |  | cambiata |  |
| activeKey | `string` |  | nuova | The active tab by its `key`, for tabs that come and go (by role, by flag). |
| activeTab | `number` | 0 | cambiata | The active tab by position. Ignored when `activeKey` is given. Defaults to 0. |

### ThemeProvider

`packages/ui/src/providers/ThemeProvider.tsx` — prop nuove: `density`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| density | `Density` |  | nuova | The default `density` of every control inside (`Input`, `Select`, `Button`, `DataGrid`); a control's own `density` prop still wins. A nested provider without one inherits the outer one's. Defaults to `"normal"`. |
| initialPalette | `ThemePalette` | palettes.baseline |  | The colour set to start on — one of `palettes`, or anything `createPalette` returns. Read once, on mount: call `setPalette` from `useTheme()` to change it afterwards. |
| onInteractionFeedback | `InteractionFeedbackHandler` |  |  | Called when the user presses, toggles or selects through one of the library's controls: wire it to haptics (`@its/glowup-device/haptics`'s `hapticFeedback`) or anything else. A control opts out with `feedback={false}`. Without it a nested provider inherits the outer one's. |

# Componenti tenuti

### Accordion

`packages/ui/src/components/Accordion.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| title * | `string` |  |  |  |
| onPress | `(expanded: boolean) => void` |  |  |  |
| startExpanded | `boolean` | false |  |  |
| style | `StyleProp<ViewStyle>` | {} |  |  |
| titleStyle | `StyleProp<TextStyle>` | {} |  |  |

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

### AnimatedFAB

`packages/ui/src/components/AnimatedFAB.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| icon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| label * | `string` |  |  | Always required: it is the label that animates. |
| onPress * | `() => void` |  |  |  |
| animateFrom | `"left" \| "right"` | "right" |  | Edge the label grows from. Match it to the FAB's own corner. |
| disabled | `boolean` | false |  |  |
| duration | `number` | 150 |  | Animation duration (ms). |
| extended | `boolean` | true |  | `true` shows the label, `false` collapses to the icon. Drive it from a scroll offset to get the M3 "shrink on scroll" behaviour. |
| iconMode | `"static" \| "dynamic"` | "static" |  | `static` keeps the icon put and slides the label out beside it. `dynamic` lets the icon travel with the label as the pill grows. |
| placement | `"floating" \| "inline"` | "floating" |  | `inline` drops the absolute positioning (toolbar, card action row). |
| position | `AnimatedFABPosition` | "bottom-right" |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### AppBar

`packages/ui/src/components/AppBar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| navigation * | `any` |  |  |  |
| options * | `any` |  |  |  |
| route * | `any` |  |  |  |
| back | `{ title?: string; href?: string } \| boolean` |  |  | Truthy when a back destination exists (native-stack passes { title, href }) |
| isPinned | `boolean` | false |  |  |

### AspectRatio

`packages/ui/src/components/Layout/AspectRatio.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| ratio | `number` | 1 |  | Width divided by height — `16 / 9`, `1`, `4 / 3`. Defaults to `1`. |

### Avatar

`packages/ui/src/components/Avatar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| backgroundColor | `string` |  |  |  |
| icon | `MaterialCommunityIconsGlyphs` | "account" |  |  |
| name | `string` |  |  |  |
| onPress | `() => void` |  |  |  |
| size | `number` | 40 |  |  |
| source | `ImageSourcePropType` |  |  |  |
| status | `"online" \| "offline" \| "busy" \| "away" \| null` |  |  |  |
| textColor | `string` |  |  |  |
| variant | `"circular" \| "rounded" \| "square"` | "circular" |  | Shape: full circle, rounded corners, or square. |

### Badge

`packages/ui/src/components/Badge.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| count | `number` |  |  |  |
| max | `number` | 99 |  | Cap shown as "max+" when count exceeds it. |
| showZero | `boolean` | false |  | Render the badge even when count is 0 (hidden by default). |
| size | `"small" \| "large"` | "large" |  |  |
| style | `any` |  |  |  |
| visible | `boolean` | true |  |  |

### Box

`packages/ui/src/components/Layout/Box.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| bg | `ColorValue` |  |  | Background — an M3 color role name or a raw color. |
| borderColor | `ColorValue` |  |  |  |
| borderWidth | `number` |  |  |  |
| flex | `number` |  |  |  |
| gap | `SpacingValue` |  |  |  |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| m | `SpacingValue` |  |  | Margin on every edge. |
| mb | `SpacingValue` |  |  |  |
| ml | `SpacingValue` |  |  |  |
| mr | `SpacingValue` |  |  |  |
| mt | `SpacingValue` |  |  |  |
| mx | `SpacingValue` |  |  |  |
| my | `SpacingValue` |  |  |  |
| p | `SpacingValue` |  |  | Padding on every edge. |
| pb | `SpacingValue` |  |  |  |
| pl | `SpacingValue` |  |  |  |
| pr | `SpacingValue` |  |  |  |
| pt | `SpacingValue` |  |  |  |
| px | `SpacingValue` |  |  | Horizontal padding. |
| py | `SpacingValue` |  |  | Vertical padding. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| row | `boolean` |  |  | Lays children out horizontally instead of vertically. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  |  |

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

### Calendar

`packages/ui/src/components/Calendar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| autoFocus | `boolean` | false |  | Moves keyboard focus into the calendar when it mounts, so the arrow keys work at once. Web only. The date pickers set it; leave it off for a calendar that is part of a page. |
| dates | `Date[]` |  |  | Selected days in `multiple` mode. |
| endYear | `number` |  |  | Last year reachable from the year grid and the endless scroller. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, computed holidays). |
| keyboardNavigation | `boolean` | true |  | Arrow-key/PageUp/Home/Enter navigation. Web only — there is no key event source on native. Default `true`. |
| labels | `DateTimePickerLabels` |  |  |  |
| locale | `string` |  |  | Formatting/labelling locale. Defaults to the device locale. |
| onChange | `(date: Date) => void` |  |  | Fires in `single` mode. |
| onDatesChange | `(dates: Date[]) => void` |  |  | Fires in `multiple` mode with the full set after the tap. |
| onRangeChange | `(range: DateRange) => void` |  |  | Fires in `range` mode with the interval after the tap. |
| onRequestClose | `() => void` |  |  | Called on Escape while keyboard navigation is active. |
| range | `DateRange` | EMPTY_RANGE |  | Selected interval in `range` mode. |
| scrollMode | `CalendarScrollMode` | "endless" |  | `endless` scrolls through months in one virtualized list; `paged` shows one month at a time behind the chevrons. Defaults to `endless`. |
| selectionMode | `DateSelectionMode` | "single" |  | How many days the grid collects. Defaults to `"single"`. |
| showToday | `boolean` | true |  | Renders the "Today" shortcut row. Default `true`. |
| startYear | `number` |  |  | First year reachable from the year grid and the endless scroller. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |
| value | `Date \| null` |  |  | Selected day in `single` mode. |

### Card

`packages/ui/src/components/Card.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| accessibilityLabel | `string` |  |  |  |
| onPress | `() => void` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |
| variant | `"elevated" \| "filled" \| "outlined" \| "glow"` | "filled" |  |  |

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

### CardTitle

`packages/ui/src/components/CardParts/CardTitle.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| title * | `React.ReactNode` |  |  |  |
| left | `React.ReactNode` |  |  | Leading slot — an `Avatar`, an `Icon`, a `StatusBadge`. |
| right | `React.ReactNode` |  |  | Trailing slot — an `IconButton`, a `Menu` anchor, a `Chip`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| subtitle | `React.ReactNode` |  |  |  |
| subtitleNumberOfLines | `number` | 2 |  |  |
| titleNumberOfLines | `number` | 1 |  |  |

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

### Center

`packages/ui/src/components/Layout/Center.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| bg | `ColorValue` |  |  | Background — an M3 color role name or a raw color. |
| borderColor | `ColorValue` |  |  |  |
| borderWidth | `number` |  |  |  |
| flex | `number` |  |  |  |
| gap | `SpacingValue` |  |  |  |
| height | `ViewStyle["height"]` |  |  |  |
| m | `SpacingValue` |  |  | Margin on every edge. |
| mb | `SpacingValue` |  |  |  |
| ml | `SpacingValue` |  |  |  |
| mr | `SpacingValue` |  |  |  |
| mt | `SpacingValue` |  |  |  |
| mx | `SpacingValue` |  |  |  |
| my | `SpacingValue` |  |  |  |
| p | `SpacingValue` |  |  | Padding on every edge. |
| pb | `SpacingValue` |  |  |  |
| pl | `SpacingValue` |  |  |  |
| pr | `SpacingValue` |  |  |  |
| pt | `SpacingValue` |  |  |  |
| px | `SpacingValue` |  |  | Horizontal padding. |
| py | `SpacingValue` |  |  | Vertical padding. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| row | `boolean` |  |  | Lays children out horizontally instead of vertically. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  |  |

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

### ChipGroup

`packages/ui/src/components/ChipGroup.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: any) => void` |  |  |  |
| options * | `ChipGroupOption[]` |  |  |  |
| value * | `string \| string[] \| null` |  |  | The selected value (or `null`), or the selected values with `multiSelect`. |
| accessibilityLabel | `string` |  |  | Names the group for assistive tech. |
| mode | `"filled" \| "tonal" \| "outlined"` | "outlined" |  | Chip look. Defaults to `"outlined"`, the M3 filter chip. |
| multiSelect | `boolean` | false |  | Filter chips: any number selected. Defaults to `false` (one at most). |
| required | `boolean` | false |  | Single select only: the selected chip cannot be deselected. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| wrap | `boolean` | true |  | `true` wraps onto more lines; `false` scrolls sideways. Defaults to `true`. |

### CircularProgress

`packages/ui/src/components/Progress/CircularProgress.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| accessibilityLabel | `string` |  |  |  |
| color | `string` |  |  | Indicator colour. Defaults to `primary`. |
| decorative | `boolean` | false |  | Hides it from assistive tech when something else announces the progress. |
| duration | `number` | 1000 |  | Indeterminate only: one revolution, in ms. |
| progress | `number` |  |  | Completion from 0 to 1. Set, the ring fills to it over a track; unset, the indicator spins (indeterminate). |
| size | `number` | 48 |  |  |
| strokeWidth | `number` | 4 |  |  |
| testID | `string` |  |  |  |

### ClockDial

`packages/ui/src/components/ClockDial.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| hours * | `number` |  |  | Current hour, always 0–23 regardless of the displayed clock format. |
| minutes * | `number` |  |  |  |
| onChangeHours * | `(hours: number) => void` |  |  |  |
| onChangeMinutes * | `(minutes: number) => void` |  |  |  |
| unit * | `ClockUnit` |  |  |  |
| isTimeDisabled | `(hours: number, minutes: number) => boolean` |  |  | Greys out and refuses values the caller does not allow. |
| minuteInterval | `number` | 1 |  | Minute granularity the dial snaps to. Defaults to 1. |
| onUnitComplete | `() => void` |  |  | Fires when a press on the hour dial ends, to hand over to the minutes. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` | false |  | Renders two rings (1–12 outer, 13–00 inner) instead of one. |

### ClockPicker

`packages/ui/src/components/ClockPicker.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date` |  |  |  |
| inputType | `PickerInputType` | "picker" |  | `picker` shows the dial, `keyboard` two text fields. Defaults to `picker`. |
| labels | `DateTimePickerLabels` |  |  |  |
| locale | `string` |  |  | Formatting locale; decides 12h vs 24h. Defaults to the device locale. |
| maximumDate | `Date` |  |  | Clamps the selectable times on the maximum's own day. |
| minimumDate | `Date` |  |  | Clamps the selectable times on the minimum's own day. |
| minuteInterval | `MinuteInterval` | 1 |  | Minute granularity. Defaults to 1. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour face. Left unset, the locale decides. |

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

### ConfirmDialog

`packages/ui/src/components/Modal/ConfirmDialog.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onCancel * | `() => void` |  |  |  |
| onConfirm * | `() => void` |  |  |  |
| visible * | `boolean` |  |  |  |
| cancelText | `string` | "Cancel" |  |  |
| confirmText | `string` | "Confirm" |  |  |
| destructive | `boolean` | false |  | Renders the confirm action in the error tone (delete, discard). |
| dismissable | `boolean` | true |  | Whether the scrim and ESC cancel the dialog. Leave it off for a decision the user must answer explicitly. Defaults to `true`. |
| icon | `IconSource` |  |  | Hero glyph above the title. |
| message | `string` |  |  |  |
| title | `string` |  |  |  |

### DatePicker

`packages/ui/src/components/DatePicker.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| selectionMode | `"single"` |  |  |  |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |

### DatePickerInput

`packages/ui/src/components/DatePickerInput.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |

### DateRangePicker

`packages/ui/src/components/DateRangePicker.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(range: DateRange) => void` |  |  |  |
| value * | `DateRange` |  |  |  |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |

### DateTimePicker

`packages/ui/src/components/DateTimePicker.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| mode | `DateTimePickerMode` |  |  |  |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| selectionMode | `"single"` |  |  |  |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |

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

### DrawerItem

`packages/ui/src/components/NavigationDrawer.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  |  |
| onPress * | `() => void` |  |  |  |
| badge | `string \| number` |  |  | Trailing text, e.g. an unread count: `24`, `"100+"`. |
| disabled | `boolean` | false |  |  |
| icon | `MaterialCommunityIconsGlyphs` |  |  | Leading glyph. The active state strips an "-outline" suffix. |
| selected | `boolean` | false |  | Whether this is the current destination. |
| testID | `string` |  |  |  |

### DrawerSection

`packages/ui/src/components/NavigationDrawer.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| showDivider | `boolean` | false |  | Draws a divider above the section — between it and the one before. |
| title | `string` |  |  | Section headline. |

### EmptyState

`packages/ui/src/components/EmptyState.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| title * | `string` |  |  |  |
| action | `EmptyStateAction` |  |  |  |
| description | `string` |  |  |  |
| icon | `MaterialCommunityIconsGlyphs` | "inbox-outline" |  |  |

### FAB

`packages/ui/src/components/FAB.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| icon * | `MaterialCommunityIconsGlyphs` |  |  |  |
| onPress * | `() => void` |  |  |  |
| disabled | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| label | `string` |  |  |  |
| placement | `FABPlacement` | "floating" |  |  |
| position | `FABPosition` | "bottom-right" |  |  |
| size | `FABSize` | "regular" |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

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

### Grid

`packages/ui/src/components/Layout/Grid.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| columns | `number` | 2 |  | Fixed column count. Ignored when `minChildWidth` is set. |
| minChildWidth | `number` |  |  | Responsive alternative to `columns`: fits as many columns of at least this width as the container allows. |
| spacing | `SpacingValue` | "s" |  | Gap between cells — a spacing token name or a raw value. |

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

### HStack

`packages/ui/src/components/Layout/Stack.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| bg | `ColorValue` |  |  | Background — an M3 color role name or a raw color. |
| borderColor | `ColorValue` |  |  |  |
| borderWidth | `number` |  |  |  |
| flex | `number` |  |  |  |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| m | `SpacingValue` |  |  | Margin on every edge. |
| mb | `SpacingValue` |  |  |  |
| ml | `SpacingValue` |  |  |  |
| mr | `SpacingValue` |  |  |  |
| mt | `SpacingValue` |  |  |  |
| mx | `SpacingValue` |  |  |  |
| my | `SpacingValue` |  |  |  |
| p | `SpacingValue` |  |  | Padding on every edge. |
| pb | `SpacingValue` |  |  |  |
| pl | `SpacingValue` |  |  |  |
| pr | `SpacingValue` |  |  |  |
| pt | `SpacingValue` |  |  |  |
| px | `SpacingValue` |  |  | Horizontal padding. |
| py | `SpacingValue` |  |  | Vertical padding. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingValue` |  |  | Gap between children — a spacing token name or a raw value. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  |  |

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

### LinearProgress

`packages/ui/src/components/Progress/LinearProgress.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| color | `string` |  |  |  |
| decorative | `boolean` | false |  | Hide the bar from assistive technology, for when the component around it already announces the progress — a bar inside a button is not a second control to land on. |
| duration | `number` | 500 |  |  |
| height | `DimensionValue` | 4 |  | Bar thickness. A percentage fills the parent — a progress surface. |
| indeterminate | `boolean` | false |  |  |
| indeterminateDuration | `number` | 1500 |  |  |
| progress | `number` | 0 |  |  |
| trackColor | `string` |  |  |  |

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
| showExternalIcon | `boolean` |  |  | Appends an external-link icon. Defaults to `true` when `href` is remote. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| textStyle | `StyleProp<TextStyle>` |  |  |  |
| underline | `"always" \| "hover" \| "none"` | "hover" |  | Underline behaviour. Defaults to `"hover"`. |
| variant | `keyof Theme["typography"]` | "bodyMedium" |  | M3 typography variant for the label. Defaults to `"bodyMedium"`. |

### ListSection

`packages/ui/src/components/List/ListSection.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| divider | `boolean` | false |  | Rule below the section, for a settings screen of stacked groups. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| title | `string` |  |  | Group label rendered above the rows as a heading. |

### ListSubheader

`packages/ui/src/components/List/ListSubheader.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| style | `StyleProp<TextStyle>` |  |  |  |

### Menu

`packages/ui/src/components/Menu.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| anchor * | `React.ReactElement` |  |  |  |
| items * | `MenuItem[]` |  |  |  |
| onDismiss * | `() => void` |  |  |  |
| visible * | `boolean` |  |  |  |
| closeOnSelect | `boolean` | true |  | Close the menu automatically after an item is pressed. Default true. |

### NavigationBar

`packages/ui/src/components/NavigationBar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeId * | `string` |  |  |  |
| items * | `NavigationBarItem[]` |  |  |  |
| onItemPress * | `(id: string) => void` |  |  |  |
| showLabels | `"always" \| "selected"` | "always" |  | "always" shows every label, "selected" only the active one. |

### NavigationDrawer

`packages/ui/src/components/NavigationDrawer.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  | `DrawerSection`s and/or `DrawerItem`s. |
| footer | `React.ReactNode` |  |  | Pinned below the scrolling items. |
| onDismiss | `() => void` |  |  | Modal only: called on scrim press, Android back and Escape (web). |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| title | `string` |  |  | Headline at the top of the drawer. |
| variant | `"standard" \| "modal"` | "standard" |  | `"standard"` is an inline panel to place beside the content (expanded windows and up). `"modal"` slides over the content with a scrim. Defaults to `"standard"`. |
| visible | `boolean` | false |  | Modal only: whether the drawer is open. |
| width | `number` | DRAWER_WIDTH |  | Defaults to 360 (M3), capped at the window width when modal. |

### NavigationRail

`packages/ui/src/components/NavigationRail.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeId * | `string` |  |  | `id` of the current destination. |
| items * | `NavigationBarItem[]` |  |  | Destinations, same shape as `NavigationBar`'s. Three to seven per M3. |
| onItemPress * | `(id: string) => void` |  |  |  |
| alignment | `"top" \| "center"` | "top" |  | Where the destinations sit vertically. Defaults to `"top"`. |
| footer | `React.ReactNode` |  |  | Pinned to the bottom of the rail. |
| header | `React.ReactNode` |  |  | Above the destinations: typically a menu `IconButton` and/or a `FAB`. |
| showLabels | `"always" \| "selected" \| "none"` | "always" |  | `"always"` labels every destination, `"selected"` only the active one, `"none"` none (the label is still the accessible name). Defaults to `"always"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |

### Pagination

`packages/ui/src/components/Pagination.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onPageChange * | `(page: number) => void` |  |  |  |
| page * | `number` |  |  | Current page, 1-based. |
| totalPages * | `number` |  |  |  |
| disabled | `boolean` |  |  |  |
| showFirstLast | `boolean` | false |  | Show jump-to-first / jump-to-last arrows. |
| siblingCount | `number` | 1 |  | Pages shown on each side of the current page. |

### Paper

`packages/ui/src/components/Paper.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| elevation | `number` | 1 |  |  |
| glow | `boolean` | false |  |  |
| outline | `boolean` | false |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### PinInput

`packages/ui/src/components/PinInput.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChangeText * | `(value: string) => void` |  |  |  |
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

### Popover

`packages/ui/src/components/Popover.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| anchor * | `React.ReactElement` |  |  |  |
| children * | `React.ReactNode` |  |  |  |
| onDismiss * | `() => void` |  |  |  |
| visible * | `boolean` |  |  |  |
| matchAnchorWidth | `boolean` |  |  |  |

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

### ProgressButton

`packages/ui/src/components/ProgressButton.tsx`

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
| mode | `ButtonMode` | "filled" |  |  |
| onPress | `() => void` |  |  | Fires in every status but `loading`, where the button is busy. |
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

### Rating

`packages/ui/src/components/Rating.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| value * | `number` |  |  | Current rating; halves are rendered (e.g. 3.5). |
| disabled | `boolean` |  |  |  |
| max | `number` | 5 |  |  |
| onChange | `(value: number) => void` |  |  | Interactive when provided; tapping a star sets a whole value. |
| size | `number` | 24 |  |  |

### SearchBar

`packages/ui/src/components/SearchBar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChangeText * | `(text: string) => void` |  |  |  |
| value * | `string` |  |  |  |
| autoFocus | `boolean` |  |  |  |
| disabled | `boolean` |  |  |  |
| leadingIcon | `MaterialCommunityIconsGlyphs` | "magnify" |  |  |
| onClear | `() => void` |  |  | Called after the clear button empties the field. |
| onSubmit | `(text: string) => void` |  |  |  |
| placeholder | `string` | "Search" |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### SideSheet

`packages/ui/src/components/SideSheet.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| onDismiss * | `() => void` |  |  | Called by the close button, and in modal mode by the scrim, Android back and Escape. |
| actions | `React.ReactNode` |  |  | A row of buttons at the bottom, below a divider. |
| modal | `boolean` | true |  | `true` slides over the content with a scrim; `false` is a standard sheet you place in a row beside the content. Defaults to `true`. |
| onBack | `() => void` |  |  | Shows a back button before the title — for a sheet with sub-pages. |
| showCloseButton | `boolean` | true |  | Defaults to `true`. |
| side | `"start" \| "end"` | "end" |  | The edge it attaches to, in reading direction. Defaults to `"end"`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| title | `string` |  |  |  |
| visible | `boolean` | false |  | Modal only: whether the sheet is open. |
| width | `number` | SHEET_WIDTH |  | Defaults to 360, capped at the window width. |

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

### Slider

`packages/ui/src/components/Slider.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: number) => void` |  |  |  |
| value * | `number` |  |  |  |
| disabled | `boolean` |  |  |  |
| feedback | `boolean` | true |  | Report each step the thumb crosses to `ThemeProvider`'s `onInteractionFeedback` (haptics), as a selection. Only with a `step`: a continuous slider would report every pixel. Defaults to true. |
| label | `string` |  |  |  |
| marks | `boolean` | false |  | Draw a tick at every step (requires step > 0). |
| max | `number` | 100 |  |  |
| min | `number` | 0 |  |  |
| onSlidingComplete | `(value: number) => void` |  |  |  |
| showValueLabel | `boolean` | false |  |  |
| step | `number` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

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

### Spinner

`packages/ui/src/components/Spinner.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(val: number) => void` |  |  |  |
| value * | `number` |  |  |  |
| disabled | `boolean` |  |  |  |
| label | `string` |  |  |  |
| max | `number` | 100 |  |  |
| min | `number` | 0 |  |  |
| step | `number` | 1 |  |  |

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

### Stack

`packages/ui/src/components/Layout/Stack.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| direction | `"vertical" \| "horizontal"` | "vertical" |  | Stacking axis. Defaults to `"vertical"`. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingValue` | "s" |  | Gap between children — a spacing token name or a raw value. |

### Stat

`packages/ui/src/components/Stat.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| label * | `string` |  |  | What the number measures. |
| value * | `string` |  |  | The number itself; pre-formatted by the caller. |
| delta | `string` |  |  | Signed change shown next to an up/down arrow, e.g. `"12.5%"`. |
| helpText | `string` |  |  | Extra context under the value. |
| icon | `MaterialCommunityIconsGlyphs` |  |  |  |
| invertTrendColors | `boolean` |  |  | Inverts the trend colors, for metrics where down is good. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| trend | `"up" \| "down" \| "flat"` |  |  | Direction of `delta`. Drives both the arrow and its color. |

### Stepper

`packages/ui/src/components/Stepper.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeStep * | `number` |  |  |  |
| steps * | `Step[] \| string[]` |  |  |  |
| onStepPress | `(stepIndex: number) => void` |  |  |  |
| style | `object` |  |  |  |

### TabContent

`packages/ui/src/components/Tab/TabContent.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| activeTab * | `number` |  |  |  |
| children * | `React.ReactNode` |  |  |  |
| style | `object` | {} |  |  |

### Table

`packages/ui/src/components/Table.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### TableHead

`packages/ui/src/components/Table.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### TableRow

`packages/ui/src/components/Table.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `ReactNode` |  |  |  |
| style | `StyleProp<ViewStyle>` |  |  |  |

### TimePicker

`packages/ui/src/components/TimePicker.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onChange * | `(date: Date) => void` |  |  |  |
| value * | `Date \| null` |  |  | `null` renders `placeholder` instead of a formatted value. |
| clearable | `boolean` |  |  | Adds a clear affordance to the field. Needs `onClear` to do anything. |
| defaultInputType | `PickerInputType` |  |  | Which surface the dialog opens on. Default `"picker"`. |
| defaultOpen | `boolean` |  |  | Mount with the picker already open. Uncontrolled after that. |
| disabled | `boolean` |  |  |  |
| endYear | `number` |  |  | Last year offered by the year grid. Defaults to 100 years on. |
| error | `string` |  |  | Error text below the field; also recolors the field. |
| firstDayOfWeek | `number` |  |  | 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. |
| helperText | `string` |  |  | Supporting text below the field; hidden while an error is shown. |
| inputEnabled | `boolean` |  |  | Lets the user type the value straight into the field. Default `true`. |
| isDateDisabled | `(date: Date) => boolean` |  |  | Excludes days `validRange` cannot express (weekends, a computed holiday set). |
| label | `string` |  |  |  |
| labels | `DateTimePickerLabels` |  |  | Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). |
| locale | `string` |  |  | Overrides the formatting/labelling locale. Defaults to the device locale. |
| minuteInterval | `MinuteInterval` |  |  | Minute granularity of the clock. Defaults to 1. |
| onClear | `() => void` |  |  |  |
| placeholder | `string` |  |  | Shown while the field has no value. |
| relativeLabels | `DateTimePickerRelativeLabels` |  |  | Overrides the relative day labels, e.g. from i18n: `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`. Defaults to the device locale via Intl.RelativeTimeFormat. |
| required | `boolean` |  |  | Appends an asterisk to the label. |
| scrollMode | `CalendarScrollMode` |  |  | Month navigation inside the dialog. Default `"endless"`. |
| startYear | `number` |  |  | First year offered by the year grid. Defaults to 100 years back. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| testID | `string` |  |  |  |
| use24HourClock | `boolean` |  |  | Forces the 24-hour clock face. Left unset, the locale decides. |
| validRange | `ValidRange` |  |  | The selectable window plus individual excluded days. |

### ToastProvider

`packages/ui/src/providers/ToastProvider.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |

### Toggle

`packages/ui/src/components/Toggle.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| onValueChange * | `(value: boolean) => void` |  |  |  |
| value * | `boolean` |  |  |  |
| containerStyle | `StyleProp<ViewStyle>` | {} |  | Style for the outer Pressable. |
| disabled | `boolean` | false |  |  |
| feedback | `boolean` | true |  | Report the switch to `ThemeProvider`'s `onInteractionFeedback` (haptics). Defaults to true. |
| height | `number` | 18 |  | Track height; the thumb scales with it. Defaults to 18. |
| width | `number` | 32 |  | Track width. Defaults to 32. |

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

### Tooltip

`packages/ui/src/components/Tooltip.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| content * | `string` |  |  | The tip's text; the body text of a rich tooltip. |
| action | `{ label: string; onPress: () => void }` |  |  | Rich only: a text button. A rich tooltip with an action stays open while the pointer is over it (web) and until the action is taken or the anchor is long-pressed again (native). |
| disabled | `boolean` |  |  |  |
| enterDelay | `number` | 500 |  | Hover dwell (ms) before the tip appears on web. Without it, sweeping the pointer across a toolbar flashes every tooltip in the row. |
| hideDelay | `number` | 1500 |  | Auto-hide delay (ms) after long-press on native. |
| leaveDelay | `number` | 100 |  | Grace period (ms) before the tip leaves on hover-out. |
| position | `"top" \| "bottom" \| "left" \| "right"` | "top" |  |  |
| title | `string` |  |  | Rich only: the subhead. |
| variant | `"plain" \| "rich"` | "plain" |  | `"plain"` is the one-line label for an icon-only control. `"rich"` adds a `title` and an `action`, for context a label cannot carry. Defaults to `"plain"`. |

### TopAppBar

`packages/ui/src/components/TopAppBar.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| title * | `React.ReactNode` |  |  |  |
| actions | `React.ReactNode` |  |  | After the title: up to three action `IconButton`s per M3. |
| divider | `boolean` | false |  | A hairline under the bar. |
| elevated | `boolean` | false |  | The on-scroll state: `surfaceContainer` instead of `surface`. |
| leading | `React.ReactNode` |  |  | Before the title: typically a back or menu `IconButton`. |
| safeArea | `boolean` | true |  | Pads the top safe-area inset. Defaults to `true`. |
| style | `StyleProp<ViewStyle>` |  |  |  |
| subtitle | `string` |  |  | A second line under the title. |
| testID | `string` |  |  |  |
| variant | `"small" \| "center" \| "medium" \| "large"` | "small" |  | `"small"` and `"center"` keep the title in the 64dp row; `"medium"` and `"large"` move it to a second, larger line. Defaults to `"small"`. |

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

### Typography

`packages/ui/src/components/Typography.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| children * | `React.ReactNode` |  |  |  |
| variant | `TypographyVariant` | "displayLarge" |  | M3 type-scale role. Defaults to `"displayLarge"`. |

### VStack

`packages/ui/src/components/Layout/Stack.tsx`

| Prop | Tipo | Default | Rispetto all'inizio | Descrizione |
| ---- | ---- | ------- | ------------------- | ----------- |
| align | `ViewStyle["alignItems"]` |  |  |  |
| bg | `ColorValue` |  |  | Background — an M3 color role name or a raw color. |
| borderColor | `ColorValue` |  |  |  |
| borderWidth | `number` |  |  |  |
| flex | `number` |  |  |  |
| height | `ViewStyle["height"]` |  |  |  |
| justify | `ViewStyle["justifyContent"]` |  |  |  |
| m | `SpacingValue` |  |  | Margin on every edge. |
| mb | `SpacingValue` |  |  |  |
| ml | `SpacingValue` |  |  |  |
| mr | `SpacingValue` |  |  |  |
| mt | `SpacingValue` |  |  |  |
| mx | `SpacingValue` |  |  |  |
| my | `SpacingValue` |  |  |  |
| p | `SpacingValue` |  |  | Padding on every edge. |
| pb | `SpacingValue` |  |  |  |
| pl | `SpacingValue` |  |  |  |
| pr | `SpacingValue` |  |  |  |
| pt | `SpacingValue` |  |  |  |
| px | `SpacingValue` |  |  | Horizontal padding. |
| py | `SpacingValue` |  |  | Vertical padding. |
| radius | `RadiusValue` |  |  | Corner radius — a shape token name or a raw radius. |
| reverse | `boolean` |  |  | Reverses the visual order without touching the children array. |
| spacing | `SpacingValue` |  |  | Gap between children — a spacing token name or a raw value. |
| width | `ViewStyle["width"]` |  |  |  |
| wrap | `boolean` |  |  |  |

