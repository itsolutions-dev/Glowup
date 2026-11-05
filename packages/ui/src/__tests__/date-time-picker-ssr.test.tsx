/**
 * A statically exported web page prerenders in Node. A picker seeded open with
 * `defaultOpen` must survive that: react-dom's server renderer has no portals,
 * and Node has no `document`, so the docked popover can only be portalled once
 * the page runs in a browser.
 */
import { renderToString } from "react-dom/server";

import { ThemeProvider } from "..";
import DateTimePicker from "../components/DateTimePicker.web";

it("prerenders a picker that starts open", () => {
  // react-dom does not know the host names of react-native: it warns about them.
  const warn = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() =>
      renderToString(
        <ThemeProvider>
          <DateTimePicker
            label="Due"
            value={null}
            onChange={() => {}}
            defaultOpen
            presentation="popover"
          />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  } finally {
    warn.mockRestore();
  }
});
