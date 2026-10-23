---
"@its/glowup-ui": minor
---

New components, and a few additions to existing ones.

Added:

- `Center` (a `Box` that centres its children; `direction="column"` for a column), `AbsoluteCenter` (lifts a child out of the flow and centres it in the parent, `axis` both, horizontal or vertical) and `Break` (negative margins that let a child out of its container's padding, per edge or per axis). `Center` returns: it is the thin `Box` wrapper, not the old component.
- `Visible`: renders its children only when `when` holds and the window is `above`, `below` or `only` the given size classes, with a `fallback` and `keepMounted`; `useBreakpointValue(values, fallback)` picks a value by size class.
- `ScrollArea`: a scrollable area whose scrollbars are drawn from the theme, on web and native (a draggable thumb, a track that pages), with `orientation`, `type` (`auto`, `always`, `scroll`, `hover`), `scrollbarSize`, `slotStyles`.
- `Editable`: text that edits in place. It reads as text; a click, tap, Enter or Space opens the library's own field (`type` `"text"`, `"textarea"`, `"number"` or `"select"`), Enter or blur keeps the change and Escape drops it. `submitMode`, `showControls`, `validate`, `placeholder`, `selectAllOnFocus`, `startWithEditView` or a controlled `editing`, `renderDisplay`.
- `PasswordField`, an `Input` for passwords with a labelled show/hide button, password-manager hints and an optional strength meter (`showStrength`; `passwordStrength(value)` is exported). `Input` gains `endAdornment`, `inputProps` and `inputRef`.
- `AlertDialog`, a `Dialog` with `role="alertdialog"` for something that needs an answer: `severity`, one action and an optional cancel, `destructive`, `loading`, and no way out but its buttons by default. `Dialog` gains `role`, `describedBy` and `initialFocus`.
- `HoverCard`: content shown when hovering (web) or long-pressing (native) an element, with `openDelay`, `closeDelay`, `placement` or `anchorPosition`, and a controlled `open`.
- `Clipboard` and `useClipboard`: a copy button (or your own trigger) with a `copy` adapter for native, the web default being the clipboard API. `CaptionValue` copies through it and takes the same `copy` adapter.
- `CodeBlock`, `HighlightedCode` and `highlight()`: syntax-coloured code (tsx, jsx, ts, js, json, bash) with line numbers, highlighted lines and a copy button.
- `Download` and `useDownload`: a button that saves a file from a string, an object (as JSON), a `Blob` or a URL, with a `save` adapter for native.
- `Upload`: pick or drop files with `accept`, `maxSize` and `maxFiles` validation, and with `onUpload` per-file progress, retry and cancel; `onPick` is the native adapter. `formatBytes`, `acceptMatches` and `validateFiles` are exported.
- `QrCode`: any text as a QR code, drawn with the library's own encoder (ISO 18004, versions 1 to 40, levels L to H, numeric, alphanumeric and byte modes), with `size`, `level`, `quietZone`, `color`, `backgroundColor` and a centre `logo`. No native module and no dependency of its own: it draws with `react-native-svg`, which the library already needs.
- `Tree`: a hierarchy that opens and closes, with single or multiple selection, checkboxes with mixed parents, lazy `loadChildren`, `renderLabel`, the ARIA tree keyboard model on the web and accessibility actions on native.
- A form engine in `Form`: `FormField`, `useForm`, `useFormField`, `useWatch`, `useFormState` and a `FormInstance`. Values, errors and the dirty, touched and submitting flags live in a store outside React state and each field subscribes to its own slice, so typing in one field re-renders that field alone. Rules (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `type`, sync or async `validator` with a cancelled stale run), nested names (`"address.city"`, `"items[0].qty"`), `dependencies`, `validateOn`. `Form` gains `initialValues`, `onSubmit(values)`, `onSubmitFailed`, `onValuesChange`, `validateOn`, `disabled` and `form`; a submit `Button` shows `loading` while its form submits. A `Form` without fields works as before.

Fixed:

- `SearchBar` in a narrow container (a 230 px sidebar) pushed its clear button out of the bar, over the page: the input could not shrink below its own width.
- A secure `Input` no longer puts the typed text in `accessibilityValue`.
