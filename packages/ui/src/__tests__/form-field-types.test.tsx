import React from "react";
import { render } from "@testing-library/react-native";
import { Checkbox, Form, FormField, Input, ThemeProvider } from "..";

// What a FormField hands its function child is typed, so the control's own
// props are still checked: an `any` spread switched that off for the whole
// element. The `@ts-expect-error` lines are the test (`npm run type-check`).
describe("FormField child types", () => {
  it("checks the child's props, by valuePropName, trigger and control", async () => {
    const view = await render(
      <ThemeProvider>
        <Form initialValues={{ email: "", terms: false }}>
          <FormField name="email" label="Email">
            {(field) => (
              // @ts-expect-error Input has no `lable`
              <Input lable="typo" {...field} />
            )}
          </FormField>
          <FormField name="email">
            {(field) => {
              // @ts-expect-error a plain field has no `checked`
              void field.checked;
              return <Input label="Plain" {...field} />;
            }}
          </FormField>
          <FormField
            name="terms"
            label="Terms"
            control
            valuePropName="checked"
            trigger="onValueChange"
          >
            {(field) => {
              const error: boolean = field.error;
              void error;
              return <Checkbox {...field} label="I accept" />;
            }}
          </FormField>
        </Form>
      </ThemeProvider>,
    );
    expect(view.getByLabelText("Email")).toBeTruthy();
    expect(view.getByLabelText("I accept")).toBeTruthy();
  });
});
