import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";

export interface FormProps {
  /**
   * Called when the form is submitted: a `Button type="submit"` inside it is
   * pressed, or (on the web) Enter is pressed in one of its fields.
   */
  onSubmit?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface FormContextValue {
  submit: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

/**
 * Internal: the `submit` of the `Form` around the caller, `undefined` outside
 * one. `Button` reads it for `type="submit"`.
 */
export const useFormSubmit = () => useContext(FormContext)?.submit;

// Visually hidden but still a rendered, focus-free submit button: it is what
// makes a browser submit a form with several fields when Enter is pressed in
// one of them (implicit submission needs a submit button to click).
const HIDDEN_SUBMIT = {
  type: "submit",
  tabIndex: -1,
  "aria-hidden": true,
  style: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    border: 0,
    opacity: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
} as const;

/**
 * Groups fields and a submit button so that one action submits them. On the
 * web it is a real `<form>`: Enter in a field submits, and a `Button
 * type="submit"` inside it submits too. On iOS and Android it is a plain
 * `View` and the submit button calls `onSubmit` directly. Either way
 * `onSubmit` runs once per submission, and the page is never navigated.
 *
 * ```tsx
 * <Form onSubmit={save}>
 *   <Input label="Name" value={name} onChange={setName} />
 *   <Button type="submit">Save</Button>
 * </Form>
 * ```
 */
const Form = ({ onSubmit, children, style, testID }: FormProps) => {
  const ref = useRef<View>(null);
  // Read through a ref so an inline handler neither re-subscribes the DOM
  // listener nor changes the context's value on every render.
  const handler = useRef(onSubmit);
  useEffect(() => {
    handler.current = onSubmit;
  });

  const submit = useCallback(() => {
    const form = ref.current as unknown as Partial<HTMLFormElement> | null;
    if (Platform.OS === "web" && typeof form?.requestSubmit === "function") {
      // Through the form's own `submit` event (below), so a press and Enter
      // share one path and run the handler exactly once.
      form.requestSubmit();
    } else {
      handler.current?.();
    }
  }, []);

  useEffect(() => {
    const form = ref.current as unknown as HTMLFormElement | null;
    if (Platform.OS !== "web" || typeof form?.addEventListener !== "function") {
      return;
    }
    const onDomSubmit = (event: Event) => {
      event.preventDefault();
      handler.current?.();
    };
    form.addEventListener("submit", onDomSubmit);
    return () => form.removeEventListener("submit", onDomSubmit);
  }, []);

  const context = useMemo(() => ({ submit }), [submit]);

  return (
    <FormContext.Provider value={context}>
      <View
        ref={ref}
        testID={testID}
        style={style}
        {...(Platform.OS === "web" && { role: "form" })}
      >
        {children}
        {Platform.OS === "web" && React.createElement("button", HIDDEN_SUBMIT)}
      </View>
    </FormContext.Provider>
  );
};

export default Form;
