import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * How much of the window the on-screen keyboard covers, 0 while it is closed
 * and always 0 on the web (the browser resizes the page itself). iOS says it
 * before the keyboard moves, Android once it has.
 */
export const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS === "web") return;
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) => setHeight(event?.endCoordinates?.height ?? 0),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
};
