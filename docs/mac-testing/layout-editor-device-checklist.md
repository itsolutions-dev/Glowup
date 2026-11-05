# Layout editor: the device checklist

The manual pass of spec §20 ("Native: a manual checklist on an iPhone and an Android device"). None of it can
run in CI today: drags, the responder system and scrolling while dragging only behave for real on a device.

Run it on **one iPhone and one Android phone**, each **upright and sideways**, on a development build of the
playground (`apps/playground`), page **/templates/editor**. Note for each step: ✅ works, ❌ fails (what you saw), or
➖ does not apply in that orientation. Copy the table into the day's handoff.

## Before you start

- Clear the app's storage (or delete and reinstall) so the editor opens "Pagina di dettaglio" fresh.
- Upright, a phone is below 600 dp: the editor follows the **phone rules** (banner "Turn the phone sideways to move
  and resize", no drag, no handles). Sideways, most phones are 600–900 dp: the **sheets** arrangement (Add and
  Properties open over the canvas from the toolbar).

## Steps

| #   | Step                                                          | Upright: expected                                     | Sideways: expected                                                              |
| --- | ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Open /templates/editor                                        | The starter, stacked; the banner; no width switch     | The starter on its grid; Add and Properties in the toolbar                      |
| 2   | Tap a Typography                                              | Selected (outline, label); no resize handles          | Selected, eight handles                                                         |
| 3   | Properties → change its text                                  | Bottom sheet; the canvas shows the new text           | Right sheet; the same                                                           |
| 4   | Undo, then Redo                                               | The text comes back, then goes again                  | The same                                                                        |
| 5   | Add → tap Input                                               | Added at the end of the stacked page, selected        | Added at the first free cell, selected                                          |
| 6   | Add → long-press Input, drag onto the page                    | ➖ (no drag)                                          | The sheet hides, the cells and landing show, the drop adds it                   |
| 7   | Long-press a Paper and move it                                | ➖                                                    | It lifts after the rest; the page does not scroll under the finger; cells; drop |
| 8   | Drag a node near the bottom edge                              | ➖                                                    | The canvas scrolls by itself; the drop lands where shown                        |
| 9   | Pull a corner handle of the selected Paper                    | ➖                                                    | It resizes cell by cell, pushing down what it covers                            |
| 10  | Drag a label from one Paper into the other                    | ➖                                                    | It lands on the other Paper's grid; the Paper grows if needed                   |
| 11  | Drag a Button into the Card's stack                           | ➖                                                    | The insertion line shows; it lands at the line                                  |
| 12  | Tap "Dati aggiuntivi" on the TabbedPanel                      | That panel is shown                                   | The same; hold a dragged node over the other tab: it switches                   |
| 13  | Layers → select a row → "Move into…" another container        | Moved; one Undo puts it back                          | The same                                                                        |
| 14  | Delete and Duplicate from the selection's buttons             | Both work, Duplicate selects the copy                 | The same                                                                        |
| 15  | Layouts → new from "Cruscotto vendite"; close the app; reopen | The dashboard opens again                             | The same                                                                        |
| 16  | Export → Code → Download                                      | The share sheet offers the .tsx                       | The same                                                                        |
| 17  | Export → Preview                                              | The preview draws, or says the engine cannot evaluate | The same                                                                        |
| 18  | Rotate the phone with a node selected                         | The selection stays; the arrangement follows          | The same                                                                        |

## What to look for beyond the expected

- The page scrolling instead of lifting a node, or lifting instead of scrolling (steps 7–8).
- A drop that lands one cell off what the landing showed.
- Text fields: the keyboard covering the Properties field being typed in.
- Anything in the Metro log (red screens, warnings that repeat on every move).
