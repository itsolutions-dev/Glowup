import { StyleProp, ViewStyle } from "react-native";
import Input from "./Input";

interface NumericInputProps {
  label?: string;
  placeholder?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: "outlined" | "filled";
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

const NumericInput = ({
  label,
  placeholder,
  precision,
  prefix,
  suffix,
  value,
  onChangeText,
  variant = "outlined",
  error,
  disabled,
  readonly,
  minHeight = 56,
  ...rest
}: NumericInputProps) => {
  return (
    <Input
      type="number"
      label={label}
      placeholder={placeholder}
      precision={precision}
      prefix={prefix}
      suffix={suffix}
      value={value}
      onChangeText={onChangeText}
      variant={variant}
      error={error}
      disabled={disabled}
      readonly={readonly}
      minHeight={minHeight}
      {...rest}
    />
  );
};

export default NumericInput;
