import React from "react";
import PickerField from "./DateTimePicker.field";
import PickerDialog from "./DateTimePicker.dialog";
import PickerSurface, { StaticPicker } from "./DateTimePicker.surface";
import { usePickerParts } from "./DateTimePicker.hooks";
import { DateTimePickerProps } from "./DateTimePicker.shared";

/**
 * The field and its dialog: the `default` variant. Native always opens the
 * dialog, so `presentation` (a web choice) has nothing to decide here.
 */
const PopupPicker = (props: DateTimePickerProps) => {
  const { controller, open, setOpen, close, fieldProps, surfaceProps } =
    usePickerParts(props);

  const openPicker = () => {
    if (props.disabled) return;
    // A half-typed value would otherwise reopen the dialog on stale text.
    controller.resetInput();
    setOpen(true);
  };

  return (
    <>
      <PickerField {...fieldProps} onClick={openPicker} />
      <PickerDialog
        visible={open}
        onClose={close}
        closeLabel={controller.labels.closePicker}
      >
        <PickerSurface {...surfaceProps} />
      </PickerDialog>
    </>
  );
};

/**
 * Material 3 date / time / date-time picker.
 *
 * The same in-house surface renders on every platform, so the field, the
 * calendar and the clock look identical on iOS, Android and web instead of
 * deferring to whatever picker the OS ships. `variant="static"` draws that
 * surface inline instead of behind a field.
 */
const DateTimePicker = ({
  showOkButton = true,
  ...rest
}: DateTimePickerProps) => {
  // The default is written here so the prop table can read it; the web file
  // and the surface agree with it.
  const props = { ...rest, showOkButton } as DateTimePickerProps;
  return props.variant === "static" ? (
    <StaticPicker {...props} />
  ) : (
    <PopupPicker {...props} />
  );
};

export default DateTimePicker;
