import React, { Profiler } from "react";
import { Platform, Text, View } from "react-native";
import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { ThemeProvider } from "../providers/ThemeProvider";
import Button from "../components/Button";
import Checkbox from "../components/Checkbox";
import Input, { type InputProps } from "../components/Input";
import Switch from "../components/Switch";
import Form, {
  useForm,
  useFormField,
  useFormState,
  useWatch,
  type FormInstance,
  type FormProps,
} from "../components/Form";
import FormField from "../components/FormField";
import {
  createFormStore,
  getIn,
  related,
  same,
  setIn,
  toKey,
  toPath,
  type FormStore,
} from "../components/internal/formStore";
import { isEmpty, validateRules } from "../components/internal/formRules";

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const flush = () => act(async () => {});

/** Records the instance a component made, so a test can drive the form from outside. */
const made = jest.fn((_form: FormInstance) => {});
const form = () => made.mock.calls[made.mock.calls.length - 1][0];
const Host = ({
  initialValues,
  children,
  ...rest
}: Omit<FormProps, "form">) => {
  const instance = useForm(initialValues);
  made(instance);
  return (
    <Form form={instance} {...rest}>
      {children}
    </Form>
  );
};

/** Input needs `value` and `onChange` as props; a FormField supplies them. */
const Field = Input as unknown as React.ComponentType<Partial<InputProps>>;

const type = (view: { getByLabelText: any }, label: string, text: string) =>
  fireEvent.changeText(view.getByLabelText(label), text);
const blur = (view: { getByLabelText: any }, label: string) =>
  fireEvent(view.getByLabelText(label), "blur");

describe("names and paths", () => {
  it("dots and brackets read the same, and are stored with brackets", () => {
    expect(toPath("items[0].qty")).toEqual(["items", 0, "qty"]);
    expect(toPath("items.0.qty")).toEqual(["items", 0, "qty"]);
    expect(toKey("items.0.qty")).toBe("items[0].qty");
    expect(toKey("address.city")).toBe("address.city");
    expect(toKey("")).toBe("");
  });

  it("setIn copies along the path, shares the rest, and creates arrays for indexes", () => {
    const base = { a: { b: 1 }, other: { x: 1 } };
    const next = setIn(base, toPath("a.b"), 2);
    expect(next).toEqual({ a: { b: 2 }, other: { x: 1 } });
    expect(next.other).toBe(base.other);
    expect(base.a.b).toBe(1);
    expect(setIn(base, toPath("a.b"), 1)).toBe(base);
    expect(setIn({}, toPath("items[1].qty"), 3)).toEqual({
      items: [undefined, { qty: 3 }],
    });
    expect(Array.isArray(setIn({}, toPath("items[0]"), 1).items)).toBe(true);
    expect(getIn(base, toPath("a.b"))).toBe(1);
    expect(getIn(base, toPath("a.zz.deep"))).toBeUndefined();
  });

  it("same treats blank values as equal and compares deeply", () => {
    expect(same("", undefined)).toBe(true);
    expect(same(null, "")).toBe(true);
    expect(same(0, "")).toBe(false);
    expect(same({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(same({ a: 1 }, { a: 1, b: "" })).toBe(true);
    expect(same({ a: 1 }, { a: 2 })).toBe(false);
    expect(same(new Date(5), new Date(5))).toBe(true);
    expect(same([1], { 0: 1 })).toBe(false);
  });

  it("a change concerns the readers of the same name, its parents and its children", () => {
    expect(related("a.b", "a.b")).toBe(true);
    expect(related("a.b", "a")).toBe(true);
    expect(related("a", "a.b")).toBe(true);
    expect(related("items", "items[0].qty")).toBe(true);
    expect(related("a.b", "a.c")).toBe(false);
    expect(related("ab", "a")).toBe(false);
    expect(related("", "anything")).toBe(true);
  });
});

describe("rules", () => {
  const signal = new AbortController().signal;
  const check = (rules: Parameters<typeof validateRules>[0], value: unknown) =>
    validateRules(rules, value, {}, signal);

  it.each([
    [{ required: true }, "", "This field is required"],
    [{ required: true }, "   ", "This field is required"],
    [{ required: true }, undefined, "This field is required"],
    [{ required: true }, false, "This field is required"],
    [{ required: true }, [], "This field is required"],
    [{ required: true }, 0, undefined],
    [{ required: true }, "x", undefined],
    [{ type: "email" }, "a@b", "Enter a valid email address"],
    [{ type: "email" }, "a@b.it", undefined],
    [{ type: "url" }, "example.com", "Enter a valid URL"],
    [{ type: "url" }, "https://example.com/a?b=1", undefined],
    [{ type: "number" }, "12abc", "Enter a number"],
    [{ type: "number" }, "12.5", undefined],
    [{ min: 5 }, "4", "Must be at least 5"],
    [{ min: 5 }, 5, undefined],
    [{ max: 5 }, "6", "Must be at most 5"],
    [{ min: 5 }, "abc", "Enter a number"],
    [{ minLength: 3 }, "ab", "Must be at least 3 characters"],
    [{ minLength: 2 }, ["a"], "Must be at least 2 items"],
    [{ maxLength: 3 }, "abcd", "Must be at most 3 characters"],
    [{ pattern: /^\d+$/ }, "12a", "Invalid format"],
    [{ pattern: /^\d+$/g }, "12", undefined],
  ] as const)("%j on %j is %j", (rule, value, expected) => {
    expect(check([rule], value)).toBe(expected);
  });

  it("a stateful /g pattern is checked the same way every time", () => {
    const rules = [{ pattern: /a/g }];
    expect([check(rules, "a"), check(rules, "a"), check(rules, "a")]).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("the other checks wait for an answer; required and validator do not", () => {
    expect(
      check([{ min: 5, minLength: 3, type: "email" }], ""),
    ).toBeUndefined();
    expect(check([{ validator: () => "always" }], "")).toBe("always");
  });

  it("message replaces the default, and the first failing rule wins", () => {
    expect(check([{ required: true, message: "Say something" }], "")).toBe(
      "Say something",
    );
    expect(
      check([{ required: true }, { minLength: 3 }, { type: "email" }], "ab"),
    ).toBe("Must be at least 3 characters");
  });

  it("a validator returns a message, anything else passes, or it throws", () => {
    expect(check([{ validator: () => "No" }], "x")).toBe("No");
    // Only a message fails: the `cond && "message"` idiom works as written.
    expect(check([{ validator: () => false }], "x")).toBeUndefined();
    expect(check([{ validator: () => "" }], "x")).toBeUndefined();
    expect(check([{ validator: () => undefined }], "x")).toBeUndefined();
    expect(check([{ validator: () => true }], "x")).toBeUndefined();
    expect(
      check(
        [
          {
            validator: () => {
              throw new Error("Boom");
            },
          },
        ],
        "x",
      ),
    ).toBe("Boom");
  });

  it("a validator reads the other values", () => {
    const rule = {
      validator: (v: string, all: any) => v !== all.pw && "Differ",
    };
    expect(validateRules([rule], "a", { pw: "b" }, signal)).toBe("Differ");
    expect(validateRules([rule], "b", { pw: "b" }, signal)).toBeUndefined();
  });

  it("an async validator makes it a promise; later rules wait for it", async () => {
    const later = jest.fn(() => "later");
    const out = check(
      [{ validator: async () => undefined }, { validator: later }],
      "x",
    );
    expect(out).toBeInstanceOf(Promise);
    await expect(out).resolves.toBe("later");
    await expect(
      check([{ validator: async () => "Taken" }, { validator: later }], "x"),
    ).resolves.toBe("Taken");
    await expect(
      check([{ validator: () => Promise.reject(new Error("Down")) }], "x"),
    ).resolves.toBe("Down");
  });

  it("isEmpty", () => {
    expect([undefined, null, "", " ", false, []].every(isEmpty)).toBe(true);
    expect([0, "0", true, [0], {}].some(isEmpty)).toBe(false);
  });
});

describe("the store", () => {
  const store = (values?: object) => createFormStore(values) as FormStore;

  it("sets, reads and merges values; getValues is stable until one changes", () => {
    const f = store({ name: "A", address: { city: "Rome", zip: "1" } });
    const before = f.getValues();
    expect(f.getValues()).toBe(before);
    f.setValue("address.city", "Milan");
    expect(f.getValue("address.city")).toBe("Milan");
    expect(f.getValue("address.zip")).toBe("1");
    expect(f.getValues()).not.toBe(before);
    f.setValues({ address: { zip: "2" }, tags: ["a"] });
    expect(f.getValues()).toEqual({
      name: "A",
      address: { city: "Milan", zip: "2" },
      tags: ["a"],
    });
    f.setValue("items[0].qty", 4);
    expect(f.getValue("items")).toEqual([{ qty: 4 }]);
  });

  it("notifies the readers of the name changed, not the others", () => {
    const f = store({ a: "", b: "", n: { x: "" } });
    const onA = jest.fn();
    const onB = jest.fn();
    const onNested = jest.fn();
    const onAny = jest.fn();
    f.subscribe("a", onA);
    f.subscribe("b", onB);
    f.subscribe("n", onNested);
    f.subscribe(onAny);
    f.setValue("a", "x");
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).not.toHaveBeenCalled();
    expect(onNested).not.toHaveBeenCalled();
    expect(onAny).toHaveBeenCalledTimes(1);
    f.setValue("n.x", "y");
    expect(onNested).toHaveBeenCalledTimes(1);
    expect(onA).toHaveBeenCalledTimes(1);
    f.setValue("a", "x"); // same value: nothing happens
    expect(onA).toHaveBeenCalledTimes(1);
  });

  it("an unsubscribed listener is not called", () => {
    const f = store({ a: "" });
    const fn = jest.fn();
    f.subscribe("a", fn)();
    f.setValue("a", "x");
    expect(fn).not.toHaveBeenCalled();
  });

  it("field state is the same object until something in it changes", () => {
    const f = store({ a: "", b: "" });
    const a = f.getFieldState("a");
    expect(f.getFieldState("a")).toBe(a);
    f.setValue("b", "x");
    expect(f.getFieldState("a")).toBe(a);
    f.setValue("a", "x");
    expect(f.getFieldState("a")).not.toBe(a);
    expect(f.getFieldState("a")).toMatchObject({ value: "x", dirty: true });
  });

  it("dirty is by value: typing and clearing is not dirty", () => {
    const f = store({ a: "" });
    f.setValue("a", "x");
    expect([f.isDirty(), f.isDirty("a")]).toEqual([true, true]);
    f.setValue("a", "");
    expect([f.isDirty(), f.isDirty("a")]).toEqual([false, false]);
  });

  it("calls onValuesChange with what changed, nested, and all values", () => {
    const f = store({ address: { city: "" }, name: "" });
    const fn = jest.fn();
    f.options.onValuesChange = fn;
    f.setValue("address.city", "Rome");
    expect(fn).toHaveBeenLastCalledWith(
      { address: { city: "Rome" } },
      { address: { city: "Rome" }, name: "" },
    );
    f.setValues({ name: "A", address: { city: "Rome" } });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn.mock.calls[1][0]).toEqual({
      name: "A",
      address: { city: "Rome" },
    });
    f.reset();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("validates registered fields on change by default and clears the error when fixed", () => {
    const f = store({ email: "" });
    f.register("email", { rules: [{ type: "email" }] });
    f.setValue("email", "nope");
    expect(f.getError("email")).toBe("Enter a valid email address");
    f.setValue("email", "a@b.it");
    expect(f.getError("email")).toBeUndefined();
    expect(f.getErrors()).toEqual({});
  });

  it.each(["blur", "submit"] as const)("validateOn %s", async (mode) => {
    const f = store({ email: "" });
    f.options.validateOn = mode;
    f.register("email", { rules: [{ type: "email" }] });
    f.setValue("email", "nope");
    expect(f.getError("email")).toBeUndefined();
    f.blur("email");
    expect(f.getError("email")).toBe(
      mode === "blur" ? "Enter a valid email address" : undefined,
    );
    if (mode === "submit") await f.submit();
    expect(f.getError("email")).toBe("Enter a valid email address");
    // Once there is an error, an edit validates again whatever the mode.
    f.setValue("email", "a@b.it");
    expect(f.getError("email")).toBeUndefined();
  });

  it("a field can override the form's mode", () => {
    const f = store({ a: "", b: "" });
    f.options.validateOn = "submit";
    f.register("a", { rules: [{ required: true }], validateOn: "change" });
    f.register("b", { rules: [{ required: true }] });
    f.setValue("a", "x");
    f.setValue("a", "");
    f.setValue("b", "x");
    f.setValue("b", "");
    expect(f.getErrors()).toEqual({ a: "This field is required" });
  });

  it("validate() runs the registered fields, all or by name (a name covers what is under it)", async () => {
    const f = store();
    f.register("a", { rules: [{ required: true }] });
    f.register("address.city", { rules: [{ required: true }] });
    f.register("address.zip", { rules: [{ required: true }] });
    expect(await f.validate("a")).toBe(false);
    expect(Object.keys(f.getErrors())).toEqual(["a"]);
    expect(await f.validate("address")).toBe(false);
    expect(Object.keys(f.getErrors()).sort()).toEqual([
      "a",
      "address.city",
      "address.zip",
    ]);
    f.setValues({ a: "x", address: { city: "R", zip: "1" } });
    expect(await f.validate()).toBe(true);
    expect(f.getErrors()).toEqual({});
  });

  it("an unmounted field drops its error and no longer blocks", async () => {
    const f = store();
    const off = f.register("a", { rules: [{ required: true }] });
    expect(await f.validate()).toBe(false);
    off();
    expect(f.getErrors()).toEqual({});
    expect(await f.validate()).toBe(true);
  });

  it("a field that shares its name with another stays validated when one leaves", async () => {
    const f = store();
    const offA = f.register("a", { rules: [{ required: true }] });
    f.register("a", {});
    offA();
    expect(await f.validate()).toBe(true); // rules left with offA
    const g = store();
    g.register("a", { rules: [{ required: true }] });
    const offReader = g.register("a", {});
    expect(await g.validate()).toBe(false);
    offReader();
    expect(g.getError("a")).toBeDefined();
  });

  it("dependencies: a dependent field is validated again, once touched or in error", () => {
    const f = store({ pw: "", confirm: "" });
    f.register("pw", {});
    f.register("confirm", {
      dependencies: ["pw"],
      rules: [{ validator: (v, all) => v !== all.pw && "Does not match" }],
    });
    f.setValue("pw", "a");
    expect(f.getError("confirm")).toBeUndefined(); // untouched and unedited: left alone
    f.setValue("confirm", "b");
    expect(f.getError("confirm")).toBe("Does not match");
    f.setValue("pw", "b");
    expect(f.getError("confirm")).toBeUndefined();
    f.setValue("pw", "c");
    expect(f.getError("confirm")).toBe("Does not match");
  });

  it("an initial value is only given to a field without one, and is not dirty", () => {
    const f = store({ a: "kept" });
    f.initField("a", "other");
    f.initField("b", "new");
    expect(f.getValues()).toEqual({ a: "kept", b: "new" });
    expect(f.isDirty()).toBe(false);
  });

  it("reset returns to the initial values, clears errors, touched and the count", async () => {
    const f = store({ a: "" });
    f.register("a", { rules: [{ required: true }] });
    await f.submit();
    f.setValue("a", "x");
    f.setError("a", "Server says no");
    f.reset();
    expect(f.getValues()).toEqual({ a: "" });
    expect(f.getErrors()).toEqual({});
    expect(f.isTouched()).toBe(false);
    expect(f.getFormState().submitCount).toBe(0);
    f.reset({ a: "fresh" });
    f.setValue("a", "x");
    f.reset();
    expect(f.getValue("a")).toBe("fresh");
  });

  it("setError sets and clears a server-side error, and is cleared by the next edit", () => {
    const f = store({ email: "" });
    f.register("email", { rules: [] });
    f.setError("email", "Already used");
    expect(f.getError("email")).toBe("Already used");
    f.setValue("email", "x");
    expect(f.getError("email")).toBeUndefined();
    f.setError("email", "Again");
    f.setError("email", undefined);
    expect(f.getErrors()).toEqual({});
  });

  describe("submit", () => {
    it("runs onSubmit synchronously when nothing is async, so a click can still open a popup", () => {
      const f = store({ a: "x" });
      const onSubmit = jest.fn();
      f.options.onSubmit = onSubmit;
      f.register("a", { rules: [{ required: true }] });
      const done = f.submit();
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ a: "x" });
      expect(f.isSubmitting()).toBe(false);
      return expect(done).resolves.toBe(true);
    });

    it("an invalid form calls onSubmitFailed with the errors and the values", async () => {
      const f = store({ a: "", b: "ok" });
      const onSubmit = jest.fn();
      const onSubmitFailed = jest.fn();
      Object.assign(f.options, { onSubmit, onSubmitFailed });
      f.register("a", { rules: [{ required: true }] });
      f.register("b", { rules: [{ required: true }] });
      expect(await f.submit()).toBe(false);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onSubmitFailed).toHaveBeenCalledWith(
        { a: "This field is required" },
        { a: "", b: "ok" },
      );
      expect(f.isTouched("a")).toBe(true);
      expect(f.getFormState().submitCount).toBe(1);
    });

    it("waits for async validators, and is submitting meanwhile", async () => {
      const f = store({ name: "x" });
      const onSubmit = jest.fn();
      f.options.onSubmit = onSubmit;
      const gate = deferred<string | undefined>();
      f.register("name", { rules: [{ validator: () => gate.promise }] });
      const done = f.submit();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(f.isSubmitting()).toBe(true);
      gate.resolve(undefined);
      expect(await done).toBe(true);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(f.isSubmitting()).toBe(false);
    });

    it("an async validator that fails blocks the submit", async () => {
      const f = store({ name: "x" });
      const onSubmit = jest.fn();
      f.options.onSubmit = onSubmit;
      f.register("name", { rules: [{ validator: async () => "Taken" }] });
      expect(await f.submit()).toBe(false);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(f.getError("name")).toBe("Taken");
    });

    it("stays submitting until an async onSubmit settles, and ignores a second submit", async () => {
      const f = store({});
      const gate = deferred<void>();
      const onSubmit = jest.fn(() => gate.promise);
      f.options.onSubmit = onSubmit;
      const first = f.submit();
      expect(f.isSubmitting()).toBe(true);
      expect(await f.submit()).toBe(false);
      gate.resolve();
      expect(await first).toBe(true);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(f.isSubmitting()).toBe(false);
      await f.submit();
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });

    it("a failing onSubmit rejects, and the form is not left submitting", async () => {
      const f = store({});
      f.options.onSubmit = async () => {
        throw new Error("Server down");
      };
      await expect(f.submit()).rejects.toThrow("Server down");
      expect(f.isSubmitting()).toBe(false);
      f.options.onSubmit = () => {
        throw new Error("Sync");
      };
      await expect(f.submit()).rejects.toThrow("Sync");
    });

    it("after a submit, an edit validates the field whatever the mode", async () => {
      const f = store({ a: "x" });
      f.options.validateOn = "submit";
      f.register("a", { rules: [{ required: true }] });
      await f.submit();
      f.setValue("a", "");
      expect(f.getError("a")).toBe("This field is required");
    });
  });

  describe("async validation", () => {
    const gates: ReturnType<typeof deferred<string | undefined>>[] = [];
    const signals: AbortSignal[] = [];
    const rules = [
      {
        validator: (_v: unknown, _all: unknown, { signal }: any) => {
          signals.push(signal);
          const gate = deferred<string | undefined>();
          gates.push(gate);
          return gate.promise;
        },
      },
    ];
    beforeEach(() => {
      gates.length = 0;
      signals.length = 0;
    });

    it("a newer run aborts the older one, and the older one's late failure is dropped", async () => {
      const f = store({ name: "" });
      f.register("name", { rules });
      const first = f.validate("name");
      const second = f.validate("name");
      expect(signals.map((s) => s.aborted)).toEqual([true, false]);
      gates[1].resolve(undefined);
      gates[0].resolve("Stale: taken");
      expect(await first).toBe(true);
      expect(await second).toBe(true);
      expect(f.getError("name")).toBeUndefined();
      expect(f.getFieldState("name").validating).toBe(false);
    });

    it("the older one's late success does not clear the newer one's failure", async () => {
      const f = store({ name: "" });
      f.register("name", { rules });
      const first = f.validate("name");
      const second = f.validate("name");
      gates[1].resolve("Taken");
      await second;
      gates[0].resolve(undefined);
      expect(await first).toBe(false);
      expect(f.getError("name")).toBe("Taken");
    });

    it("typing aborts the run for the previous text", async () => {
      const f = store({ name: "" });
      f.register("name", { rules });
      f.setValue("name", "a");
      f.setValue("name", "ab");
      expect(signals.map((s) => s.aborted)).toEqual([true, false]);
      expect(f.getFieldState("name").validating).toBe(true);
      gates[1].resolve("Taken");
      await flush();
      expect(f.getError("name")).toBe("Taken");
      expect(f.getFieldState("name").validating).toBe(false);
    });

    it("a run for a field that left is aborted and dropped", async () => {
      const f = store({ name: "" });
      const off = f.register("name", { rules });
      f.setValue("name", "a");
      off();
      expect(signals[0].aborted).toBe(true);
      gates[0].resolve("Taken");
      await flush();
      expect(f.getErrors()).toEqual({});
    });

    it("a sync run after an async one aborts it and is the result", async () => {
      const f = store({ name: "" });
      const config = { rules } as { rules: any[] };
      f.register("name", config);
      const first = f.validate("name");
      config.rules = [{ validator: () => "Sync no" }];
      expect(await f.validate("name")).toBe(false);
      gates[0].resolve(undefined);
      expect(await first).toBe(false);
      expect(f.getError("name")).toBe("Sync no");
    });
  });
});

describe("Form with fields", () => {
  const Email = (props: Partial<React.ComponentProps<typeof FormField>>) => (
    <FormField
      name="email"
      rules={[{ required: true }, { type: "email" }]}
      {...props}
    >
      <Field label="Email" />
    </FormField>
  );

  it("a function child gets the props, so a control's required props need not be written out", async () => {
    const view = await draw(
      <Host initialValues={{ email: "a@b.it" }}>
        <FormField name="email" label="Email" rules={[{ required: true }]}>
          {(field) => <Input {...field} placeholder="you@x.it" />}
        </FormField>
      </Host>,
    );
    expect(view.getByText("Email *")).toBeTruthy();
    expect(view.getByPlaceholderText("you@x.it").props.value).toBe("a@b.it");
    await type(view, "Email", "");
    expect(view.getByText("This field is required")).toBeTruthy();
    expect(form().getValue("email")).toBe("");
  });

  it("gives the control its value, and an edit reaches the form", async () => {
    const view = await draw(
      <Host initialValues={{ email: "a@b.it" }}>
        <Email />
      </Host>,
    );
    expect(view.getByLabelText("Email").props.value).toBe("a@b.it");
    await type(view, "Email", "c@d.it");
    expect(view.getByLabelText("Email").props.value).toBe("c@d.it");
    expect(form().getValue("email")).toBe("c@d.it");
  });

  it("injects label, helper text, required and the error", async () => {
    const view = await draw(
      <Host initialValues={{ email: "" }}>
        <Email label="Work email" helperText="We never share it" />
      </Host>,
    );
    expect(view.getByText("Work email *")).toBeTruthy();
    expect(view.getByText("We never share it")).toBeTruthy();
    await type(view, "Work email", "nope");
    expect(view.getByText("Enter a valid email address")).toBeTruthy();
    expect(view.queryByText("We never share it")).toBeNull();
    await type(view, "Work email", "a@b.it");
    expect(view.queryByText("Enter a valid email address")).toBeNull();
  });

  it("the control's own props and handlers still apply", async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();
    const view = await draw(
      <Host initialValues={{ email: "" }}>
        <FormField name="email">
          <Field
            label="Email"
            placeholder="you@x.it"
            onChange={onChange}
            onBlur={onBlur}
          />
        </FormField>
      </Host>,
    );
    expect(view.getByPlaceholderText("you@x.it")).toBeTruthy();
    await type(view, "Email", "a");
    await blur(view, "Email");
    expect(onChange).toHaveBeenCalledWith("a");
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(form().isTouched("email")).toBe(true);
  });

  it("validateOn=blur shows the error when the field is left", async () => {
    const view = await draw(
      <Host initialValues={{ email: "" }} validateOn="blur">
        <Email />
      </Host>,
    );
    await type(view, "Email", "nope");
    expect(view.queryByText("Enter a valid email address")).toBeNull();
    await blur(view, "Email");
    expect(view.getByText("Enter a valid email address")).toBeTruthy();
    await type(view, "Email", "a@b.it");
    expect(view.queryByText("Enter a valid email address")).toBeNull();
  });

  it("a submit button validates, shows every error and does not submit; then submits the values", async () => {
    const onSubmit = jest.fn();
    const onSubmitFailed = jest.fn();
    const view = await draw(
      <Host
        initialValues={{ email: "", name: "" }}
        onSubmit={onSubmit}
        onSubmitFailed={onSubmitFailed}
        validateOn="submit"
      >
        <Email />
        <FormField name="name" rules={[{ required: true, message: "Name it" }]}>
          <Field label="Name" />
        </FormField>
        <Button type="submit">Save</Button>
      </Host>,
    );
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitFailed).toHaveBeenCalledTimes(1);
    expect(onSubmitFailed.mock.calls[0][0]).toEqual({
      email: "This field is required",
      name: "Name it",
    });
    expect(view.getByText("This field is required")).toBeTruthy();
    expect(view.getByText("Name it")).toBeTruthy();

    await type(view, "Email", "a@b.it");
    await type(view, "Name", "Ada");
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.it", name: "Ada" });
  });

  it("a submit button spins while an async onSubmit runs, and a second press is ignored", async () => {
    const gate = deferred<void>();
    const onSubmit = jest.fn(() => gate.promise);
    const view = await draw(
      <Host initialValues={{ email: "a@b.it" }} onSubmit={onSubmit}>
        <Email />
        <Button type="submit">Save</Button>
      </Host>,
    );
    expect(
      view.getByRole("button", { name: "Save", busy: false }),
    ).toBeTruthy();
    await fireEvent.press(view.getByText("Save"));
    expect(view.getByRole("button", { name: "Save", busy: true })).toBeTruthy();
    expect(view.queryByText("Save")).toBeNull();
    await fireEvent.press(view.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await act(async () => gate.resolve());
    expect(
      view.getByRole("button", { name: "Save", busy: false }),
    ).toBeTruthy();
    expect(view.getByText("Save")).toBeTruthy();
  });

  it("an async rule shows its result and submit waits for it", async () => {
    const gate = deferred<string | undefined>();
    const onSubmit = jest.fn();
    const view = await draw(
      <Host initialValues={{ user: "ada" }} onSubmit={onSubmit}>
        <FormField name="user" rules={[{ validator: () => gate.promise }]}>
          <Field label="User" />
        </FormField>
        <Button type="submit">Save</Button>
      </Host>,
    );
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
    await act(async () => gate.resolve("Name taken"));
    expect(view.getByText("Name taken")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("initialValue seeds a field the form has no value for, and is not dirty", async () => {
    const view = await draw(
      <Host initialValues={{}}>
        <FormField name="nick" initialValue="ada">
          <Field label="Nick" />
        </FormField>
      </Host>,
    );
    expect(view.getByLabelText("Nick").props.value).toBe("ada");
    expect(form().getValues()).toEqual({ nick: "ada" });
    expect(form().isDirty()).toBe(false);
  });

  it("nested names read and write nested values", async () => {
    const view = await draw(
      <Host
        initialValues={{ address: { city: "Rome" }, items: [{ qty: "1" }] }}
      >
        <FormField name="address.city">
          <Field label="City" />
        </FormField>
        <FormField name="items[0].qty" rules={[{ type: "number" }]}>
          <Field label="Qty" />
        </FormField>
      </Host>,
    );
    expect(view.getByLabelText("City").props.value).toBe("Rome");
    expect(view.getByLabelText("Qty").props.value).toBe("1");
    await type(view, "City", "Milan");
    await type(view, "Qty", "x");
    expect(form().getValues()).toEqual({
      address: { city: "Milan" },
      items: [{ qty: "x" }],
    });
    expect(view.getByText("Enter a number")).toBeTruthy();
    expect(form().getErrors()).toEqual({ "items[0].qty": "Enter a number" });
  });

  it("normalize turns what the control reports into what is stored", async () => {
    const view = await draw(
      <Host initialValues={{ code: "" }}>
        <FormField
          name="code"
          normalize={(v: string) => v.trim().toUpperCase()}
        >
          <Field label="Code" />
        </FormField>
      </Host>,
    );
    await type(view, "Code", "  ab1 ");
    expect(form().getValue("code")).toBe("AB1");
    expect(view.getByLabelText("Code").props.value).toBe("AB1");
  });

  it("reads a DOM event's target by default, and getValueFromEvent when given", async () => {
    const Raw = ({ onChange, value }: any) => (
      <Text
        testID="raw"
        onPress={() =>
          onChange({ target: { value: "from-dom", checked: true } })
        }
      >
        {String(value)}
      </Text>
    );
    const view = await draw(
      <Host initialValues={{ a: "", b: false, c: "" }}>
        <FormField name="a">
          <Raw />
        </FormField>
        <FormField name="b" valuePropName="checked">
          <Raw />
        </FormField>
        <FormField
          name="c"
          getValueFromEvent={(e: any) => e.target.value + "!"}
        >
          <Raw />
        </FormField>
      </Host>,
    );
    for (const raw of view.getAllByTestId("raw")) await fireEvent.press(raw);
    expect(form().getValues()).toEqual({
      a: "from-dom",
      b: true,
      c: "from-dom!",
    });
  });

  it("a Checkbox: valuePropName=checked, trigger=onValueChange, control draws label and error", async () => {
    const view = await draw(
      <Host initialValues={{ terms: false }}>
        <FormField
          name="terms"
          control
          label="Terms"
          helperText="Required to continue"
          valuePropName="checked"
          trigger="onValueChange"
          rules={[{ required: true, message: "Accept the terms" }]}
        >
          <Checkbox label="I accept" checked={false} onValueChange={() => {}} />
        </FormField>
        <Button type="submit">Save</Button>
      </Host>,
    );
    expect(view.getByText("Terms *")).toBeTruthy();
    expect(view.getByText("Required to continue")).toBeTruthy();
    await fireEvent.press(view.getByText("Save"));
    expect(view.getByText("Accept the terms")).toBeTruthy();
    await fireEvent.press(view.getByRole("checkbox"));
    expect(form().getValue("terms")).toBe(true);
    expect(view.queryByText("Accept the terms")).toBeNull();
    expect(view.getByRole("checkbox").props.accessibilityState.checked).toBe(
      true,
    );
  });

  it("a Switch works with the defaults", async () => {
    const view = await draw(
      <Host initialValues={{ on: false }}>
        <FormField name="on" control label="Notifications">
          <Switch label="Email me" value={false} onChange={() => {}} />
        </FormField>
      </Host>,
    );
    await fireEvent.press(view.getByText("Email me"));
    expect(form().getValue("on")).toBe(true);
  });

  it("dependencies validate a confirm field again when the password changes", async () => {
    const view = await draw(
      <Host initialValues={{ pw: "", confirm: "" }}>
        <FormField name="pw">
          <Field label="Password" />
        </FormField>
        <FormField
          name="confirm"
          dependencies={["pw"]}
          rules={[
            {
              validator: (v: string, all: any) =>
                v !== all.pw && "Does not match",
            },
          ]}
        >
          <Field label="Confirm" />
        </FormField>
      </Host>,
    );
    await type(view, "Confirm", "abc");
    expect(view.getByText("Does not match")).toBeTruthy();
    await type(view, "Password", "abc");
    expect(view.queryByText("Does not match")).toBeNull();
  });

  it("a disabled form disables its fields and its submit buttons", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Host initialValues={{ email: "a@b.it" }} onSubmit={onSubmit} disabled>
        <Email />
        <FormField name="other" disabled={false}>
          <Field label="Other" />
        </FormField>
        <Button type="submit">Save</Button>
      </Host>,
    );
    expect(view.getByLabelText("Email").props.editable).toBe(false);
    expect(view.getByLabelText("Other").props.editable).toBe(false);
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      view.getByRole("button", { name: "Save" }).props.accessibilityState
        .disabled,
    ).toBe(true);
  });

  it("one field's own disabled", async () => {
    const view = await draw(
      <Host initialValues={{ a: "", b: "" }}>
        <FormField name="a" disabled>
          <Field label="A" />
        </FormField>
        <FormField name="b">
          <Field label="B" />
        </FormField>
      </Host>,
    );
    expect(view.getByLabelText("A").props.editable).toBe(false);
    expect(view.getByLabelText("B").props.editable).not.toBe(false);
  });

  it("reset puts the fields back", async () => {
    const view = await draw(
      <Host initialValues={{ email: "a@b.it" }}>
        <Email />
      </Host>,
    );
    await type(view, "Email", "bad");
    expect(view.getByText("Enter a valid email address")).toBeTruthy();
    await act(async () => form().reset());
    expect(view.getByLabelText("Email").props.value).toBe("a@b.it");
    expect(view.queryByText("Enter a valid email address")).toBeNull();
  });

  it("setValues and setError from outside reach the fields", async () => {
    const view = await draw(
      <Host initialValues={{ email: "" }}>
        <Email />
      </Host>,
    );
    await act(async () => form().setValues({ email: "z@z.it" }));
    expect(view.getByLabelText("Email").props.value).toBe("z@z.it");
    await act(async () => form().setError("email", "Already registered"));
    expect(view.getByText("Already registered")).toBeTruthy();
  });

  it("a Form's own initialValues start an instance from outside it", async () => {
    const Outer = () => {
      const instance = useForm({ email: "from-hook" });
      return (
        <Form form={instance} initialValues={{ email: "from-form" }}>
          <Email />
        </Form>
      );
    };
    const view = await draw(<Outer />);
    expect(view.getByLabelText("Email").props.value).toBe("from-form");
  });

  it("works with no form instance given: the hooks reach the form's own", async () => {
    const seen = jest.fn();
    const Peek = () => {
      seen(useWatch("name"));
      return null;
    };
    const view = await draw(
      <Form initialValues={{ name: "Ada" }}>
        <FormField name="name">
          <Field label="Name" />
        </FormField>
        <Peek />
      </Form>,
    );
    expect(seen).toHaveBeenLastCalledWith("Ada");
    await type(view, "Name", "Bea");
    expect(seen).toHaveBeenLastCalledWith("Bea");
  });

  it("a FormField or a hook outside any Form says what is wrong", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      draw(
        <FormField name="a">
          <Input label="A" value="" onChange={() => {}} />
        </FormField>,
      ),
    ).rejects.toThrow(/need a <Form>/);
    spy.mockRestore();
  });

  it("a FormField takes exactly one element", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      draw(
        <Host>
          <FormField name="a">
            {
              [
                <Input key="1" label="A" value="" onChange={() => {}} />,
                <Input key="2" label="B" value="" onChange={() => {}} />,
              ] as unknown as React.ReactElement
            }
          </FormField>
        </Host>,
      ),
    ).rejects.toThrow();
    spy.mockRestore();
  });
});

describe("hooks", () => {
  // Hook results are handed to a spy: what a component saw, render by render.
  const last = (spy: jest.Mock) => spy.mock.calls[spy.mock.calls.length - 1][0];

  it("useWatch with a name, with names (a stable array) and with none", async () => {
    const one = jest.fn();
    const many = jest.fn();
    const all = jest.fn();
    const Watcher = () => {
      one(useWatch("a"));
      many(useWatch(["a", "b"]));
      all(useWatch());
      return null;
    };
    const view = await draw(
      <Host initialValues={{ a: "1", b: "2", c: "3" }}>
        <FormField name="a">
          <Field label="A" />
        </FormField>
        <FormField name="c">
          <Field label="C" />
        </FormField>
        <Watcher />
      </Host>,
    );
    expect(last(one)).toBe("1");
    expect(last(many)).toEqual(["1", "2"]);
    expect(last(all)).toEqual({ a: "1", b: "2", c: "3" });
    const array = last(many);
    const rendersBefore = many.mock.calls.length;
    await type(view, "C", "30"); // the whole-form watcher re-renders, but the array is stable
    expect(last(many)).toBe(array);
    expect(many.mock.calls.length).toBe(rendersBefore + 1);
    await type(view, "A", "10");
    expect(last(many)).toEqual(["10", "2"]);
    expect(last(one)).toBe("10");
  });

  it("useWatch with a parent name sees a nested change", async () => {
    const seen = jest.fn();
    const Watcher = () => {
      seen(useWatch("address"));
      return null;
    };
    await draw(
      <Host initialValues={{ address: { city: "Rome" } }}>
        <Watcher />
      </Host>,
    );
    await act(async () => form().setValue("address.city", "Milan"));
    expect(last(seen)).toEqual({ city: "Milan" });
  });

  it("useWatch and useFormState read an instance from above the Form", async () => {
    const name = jest.fn();
    const state = jest.fn();
    const Screen = () => {
      const f = useForm<{ name: string }>({ name: "Ada" });
      made(f);
      name(useWatch("name", f));
      state(useFormState(f));
      return (
        <Form form={f}>
          <FormField name="name">
            <Field label="Name" />
          </FormField>
        </Form>
      );
    };
    const view = await draw(<Screen />);
    expect(last(name)).toBe("Ada");
    expect(last(state)).toMatchObject({
      isDirty: false,
      isSubmitting: false,
      submitCount: 0,
    });
    await type(view, "Name", "Bea");
    expect(last(name)).toBe("Bea");
    expect(last(state).isDirty).toBe(true);
    await act(async () => form().reset());
    expect(last(state).isDirty).toBe(false);
  });

  it("useFormState follows submitting and errors", async () => {
    const state = jest.fn();
    const Flags = () => {
      state(useFormState());
      return null;
    };
    const gate = deferred<void>();
    const view = await draw(
      <Host initialValues={{ a: "" }} onSubmit={() => gate.promise}>
        <FormField name="a" rules={[{ required: true }]}>
          <Field label="A" />
        </FormField>
        <Flags />
        <Button type="submit">Go</Button>
      </Host>,
    );
    await fireEvent.press(view.getByText("Go"));
    expect(last(state).errors).toEqual({ a: "This field is required" });
    expect(last(state).submitCount).toBe(1);
    await type(view, "A", "x");
    expect(last(state).errors).toEqual({});
    await fireEvent.press(view.getByText("Go"));
    expect(last(state).isSubmitting).toBe(true);
    await act(async () => gate.resolve());
    expect(last(state).isSubmitting).toBe(false);
  });

  it("useFormField drives a custom control, with or without rules", async () => {
    const field = jest.fn();
    const reader = jest.fn();
    const Custom = () => {
      field(
        useFormField("code", {
          rules: [{ required: true, message: "Need a code" }],
          initialValue: "",
          normalize: (v: string) => v.toUpperCase(),
        }),
      );
      return null;
    };
    const Reader = () => {
      reader(useFormField("code"));
      return null;
    };
    const Shell = ({ show }: { show: boolean }) => (
      <Host>
        <Custom />
        {show && <Reader />}
      </Host>
    );
    const view = await draw(<Shell show />);
    expect(last(field)).toMatchObject({
      value: "",
      dirty: false,
      touched: false,
    });
    await act(async () => last(field).setValue("ab"));
    expect(last(field).value).toBe("AB");
    expect(last(reader).value).toBe("AB");
    await act(async () => last(field).setValue(""));
    expect(last(field).error).toBe("Need a code");
    // A reader that leaves must not clear the error of the field that has the rules.
    await view.rerender(
      <ThemeProvider>
        <Shell show={false} />
      </ThemeProvider>,
    );
    expect(last(field).error).toBe("Need a code");
    await act(async () => last(field).onBlur());
    expect(last(field).touched).toBe(true);
    await act(async () => last(field).setError(undefined));
    expect(last(field).error).toBeUndefined();
    await act(async () => {
      expect(await last(field).validate()).toBe(false);
    });
    expect(last(field).error).toBe("Need a code");
  });
});

describe("performance: a keystroke re-renders only what shows that value", () => {
  const rendered = jest.fn((_id: string) => {});
  const times = (id: string) =>
    rendered.mock.calls.filter(([who]) => who === id).length;

  const Probe = ({ id, ...rest }: { id: string } & Partial<InputProps>) => {
    rendered(id);
    return <Input label={id} value="" onChange={() => {}} {...rest} />;
  };
  const Watch = ({ id, name }: { id: string; name: string }) => {
    rendered(id);
    useWatch(name);
    return null;
  };
  const Screen = () => {
    rendered("screen");
    const f = useForm({ a: "", b: "", c: "" });
    return (
      <Form form={f}>
        <FormField name="a" rules={[{ required: true }]}>
          <Probe id="a" />
        </FormField>
        <FormField name="b" rules={[{ required: true }]}>
          <Probe id="b" />
        </FormField>
        <FormField name="c" rules={[{ required: true }]}>
          <Probe id="c" />
        </FormField>
        <Watch id="watch-a" name="a" />
        <Watch id="watch-b" name="b" />
        <Profiler id="button" onRender={() => rendered("button")}>
          <Button type="submit">Save</Button>
        </Profiler>
      </Form>
    );
  };
  const ids = ["a", "b", "c", "watch-a", "watch-b", "screen", "button"];
  const snapshot = () => Object.fromEntries(ids.map((id) => [id, times(id)]));

  beforeEach(() => rendered.mockClear());

  it("typing in field A re-renders A and what watches A: not B, C, a watcher of B, the form or its parent", async () => {
    const view = await draw(<Screen />);
    const before = snapshot();

    await type(view, "a", "x");
    await type(view, "a", "xy");
    await type(view, "a", "xyz");

    const after = snapshot();
    expect(after.a - before.a).toBe(3);
    expect(after["watch-a"] - before["watch-a"]).toBe(3);
    expect(after.b).toBe(before.b);
    expect(after.c).toBe(before.c);
    expect(after["watch-b"]).toBe(before["watch-b"]);
    expect(after.screen).toBe(before.screen);
    expect(after.button).toBe(before.button); // a submit button follows the form's flags, not its values
  });

  it("an error appearing re-renders only its own field, once", async () => {
    const view = await draw(<Screen />);
    await type(view, "b", "x");
    const before = snapshot();
    await type(view, "b", ""); // required fails: value and error change together
    const after = snapshot();
    expect(view.getByText("This field is required")).toBeTruthy();
    expect(after.b - before.b).toBe(1);
    expect(after.a).toBe(before.a);
    expect(after.c).toBe(before.c);
  });

  it("blurring a field re-renders that field alone", async () => {
    const view = await draw(<Screen />);
    const before = snapshot();
    await blur(view, "c");
    const after = snapshot();
    expect(after.c - before.c).toBe(1);
    expect(after.a).toBe(before.a);
    expect(after.b).toBe(before.b);
  });

  it("a hundred fields: one keystroke re-renders one", async () => {
    const Cell = ({ i, ...rest }: { i: number } & Partial<InputProps>) => {
      rendered(`cell-${i}`);
      return <Input label={`f${i}`} value="" onChange={() => {}} {...rest} />;
    };
    const names = Array.from({ length: 100 }, (_, i) => i);
    const view = await draw(
      <Host initialValues={Object.fromEntries(names.map((i) => [`f${i}`, ""]))}>
        {names.map((i) => (
          <FormField key={i} name={`f${i}`} rules={[{ maxLength: 5 }]}>
            <Cell i={i} />
          </FormField>
        ))}
      </Host>,
    );
    const before = names.map((i) => times(`cell-${i}`));
    await type(view, "f42", "hello");
    const rerendered = names.filter((i) => times(`cell-${i}`) !== before[i]);
    expect(rerendered).toEqual([42]);
  });
});

describe("a form of parent-held state is unchanged", () => {
  it("onSubmit runs once per press, with no fields, and gets an empty object", async () => {
    const onSubmit = jest.fn();
    const Parent = () => {
      const [name, setName] = React.useState("");
      return (
        <Form onSubmit={onSubmit}>
          <Input label="Name" value={name} onChange={setName} />
          <Button type="submit">Save</Button>
        </Form>
      );
    };
    const view = await draw(<Parent />);
    await type(view, "Name", "Ada");
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({});
  });

  it("is synchronous: the handler has run by the time the press returns", () => {
    const f = createFormStore();
    const order: string[] = [];
    f.options.onSubmit = () => {
      order.push("submit");
    };
    f.submit();
    order.push("after");
    expect(order).toEqual(["submit", "after"]);
  });
});

describe("Form with fields on the web", () => {
  type Listener = (event: { preventDefault: () => void }) => void;
  const original = Object.getOwnPropertyDescriptor(Platform, "OS")!;
  const proto = (View as unknown as { prototype: Record<string, unknown> })
    .prototype;
  const listeners = new Map<string, Listener>();

  beforeEach(() => {
    Object.defineProperty(Platform, "OS", {
      get: () => "web",
      configurable: true,
    });
    proto.addEventListener = (t: string, fn: Listener) => listeners.set(t, fn);
    proto.removeEventListener = (t: string) => listeners.delete(t);
    proto.requestSubmit = () =>
      listeners.get("submit")?.({ preventDefault() {} });
  });
  afterEach(async () => {
    await cleanup();
    Object.defineProperty(Platform, "OS", original);
    delete proto.addEventListener;
    delete proto.removeEventListener;
    delete proto.requestSubmit;
    listeners.clear();
  });

  it("Enter in a field (the form's submit event) validates, then submits the values once", async () => {
    const onSubmit = jest.fn();
    const onSubmitFailed = jest.fn();
    const view = await draw(
      <Host
        initialValues={{ email: "" }}
        onSubmit={onSubmit}
        onSubmitFailed={onSubmitFailed}
      >
        <FormField name="email" rules={[{ required: true }]}>
          <Field label="Email" />
        </FormField>
      </Host>,
    );
    const preventDefault = jest.fn();
    await act(async () => listeners.get("submit")?.({ preventDefault }));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitFailed).toHaveBeenCalledTimes(1);
    await type(view, "Email", "a@b.it");
    await act(async () => listeners.get("submit")?.({ preventDefault }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.it" });
  });

  it("a submit Button goes through the form's own submit event", async () => {
    const onSubmit = jest.fn();
    const view = await draw(
      <Host initialValues={{ a: "x" }} onSubmit={onSubmit}>
        <FormField name="a" rules={[{ required: true }]}>
          <Field label="A" />
        </FormField>
        <Button type="submit">Save</Button>
      </Host>,
    );
    await fireEvent.press(view.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("the library exports", () => {
  it("exposes the form engine from the package root", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const lib = require("..");
    for (const name of [
      "Form",
      "FormField",
      "FormControl",
      "useForm",
      "useFormField",
      "useFormState",
      "useWatch",
    ]) {
      expect(typeof lib[name]).toBe("function");
    }
  });
});
