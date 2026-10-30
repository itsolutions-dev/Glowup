import React from "react";
import { render, within } from "@testing-library/react-native";
import { Link, ThemeProvider } from "..";

// The icon is a font glyph: a second Text beside the label.
const hasIcon = async (href: string) => {
  const view = await render(
    <ThemeProvider>
      <Link href={href}>Contact</Link>
    </ThemeProvider>,
  );
  const link = view.getByRole("link", { name: "Contact" });
  return within(link).queryAllByText(/./).length > 1;
};

// The "opens a new page" icon belongs on a web address, not on an email
// address or a phone number, which open the mail or phone app.
it.each([
  ["https://example.com", true],
  ["http://example.com", true],
  ["mailto:info@example.com", false],
  ["tel:+390212345", false],
  ["/contacts", false],
])("%s draws the external icon: %s", async (href, expected) => {
  expect(await hasIcon(href)).toBe(expected);
});
