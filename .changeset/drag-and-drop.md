---
"@its/glowup-ui": minor
---

Drag and drop, with no new dependency: `DragDropProvider`, `Draggable`, `Droppable` and `useDragDrop`, on iOS, Android and the web, by touch and by mouse. A touch lifts an item after resting on it for 250 ms (a swipe still scrolls), a mouse after moving 4 px (a click still clicks); a pressable child such as a `Card` keeps its tap. The item stays in place, dimmed, while a preview follows the pointer through the `Portal`, and a line marks where it would land. `onDragEnd({ active, over })` reports the drop, with `over.index` counted without the dragged item, so reordering a list and moving between lists read the same way. Zones nest (the innermost one that `accept`s the item wins, and a zone never takes the draggable it sits in), `orientation` sets the axis, Escape cancels on the web, and a touch lift reports a `longPress` to `onInteractionFeedback`. Inside a `ScrollView`, pass `scrollEnabled={!active}` from `useDragDrop()`.
