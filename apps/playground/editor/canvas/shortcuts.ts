// The editor's keyboard shortcuts (spec §14), registered by the page with
// usePageShortcuts so the site's dialog lists them under "This page".

import type { Shortcut } from "../../site/useKeyboardShortcuts";
import { nudge, type Arrow } from "../keys";
import { duplicateNode, removeNode } from "../operations";
import type { Editor } from "./useEditor";

const ARROWS: [Arrow, string, string][] = [
  ["ArrowLeft", "←", "left"],
  ["ArrowRight", "→", "right"],
  ["ArrowUp", "↑", "up"],
  ["ArrowDown", "↓", "down"],
];

export const editorShortcuts = (editor: Editor): Shortcut[] => {
  const { doc, selected } = editor;
  const remove = () => {
    if (selected) editor.apply(removeNode(doc, selected));
  };
  return [
    {
      key: "Delete",
      label: "Del",
      description: "Delete the selection",
      run: remove,
    },
    {
      key: "Backspace",
      label: "⌫",
      description: "Delete the selection (Backspace)",
      run: remove,
    },
    {
      key: "z",
      meta: true,
      shift: false,
      label: "Z",
      description: "Undo",
      run: editor.undo,
    },
    {
      key: "z",
      meta: true,
      shift: true,
      label: "Z",
      description: "Redo",
      run: editor.redo,
    },
    {
      key: "d",
      meta: true,
      label: "D",
      description: "Duplicate the selection",
      run: () => {
        if (!selected) return;
        const copy = duplicateNode(doc, selected);
        editor.apply(copy.doc);
        if (copy.id) editor.select(copy.id);
      },
    },
    ...ARROWS.flatMap(([key, label, way]): Shortcut[] =>
      [false, true].map((resize) => ({
        key,
        shift: resize,
        label,
        description: resize
          ? `Resize the selection (${way})`
          : `Move the selection one cell ${way}`,
        // Consecutive steps on one node are one undo step.
        run: () =>
          editor.apply(nudge(doc, selected, key, resize), `nudge:${selected}`),
      })),
    ),
    {
      key: "Escape",
      label: "Esc",
      description: "Clear the selection",
      run: () => editor.select(null),
    },
  ];
};
