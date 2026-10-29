import { Platform } from "react-native";
import { gradientStyle } from "../index";

afterEach(() => jest.restoreAllMocks());

describe("gradientStyle", () => {
  it("draws with React Native's own background image on iOS and Android", () => {
    expect(gradientStyle("#1D5B9D", "#61B340")).toEqual({
      backgroundColor: "#1D5B9D",
      experimental_backgroundImage: "linear-gradient(90deg, #1D5B9D, #61B340)",
    });
  });

  it("draws with CSS on the web", () => {
    jest.replaceProperty(Platform, "OS", "web");
    expect(gradientStyle("#1D5B9D", "#61B340")).toEqual({
      backgroundColor: "#1D5B9D",
      backgroundImage: "linear-gradient(90deg, #1D5B9D, #61B340)",
    });
  });

  it("takes an angle", () => {
    expect(
      gradientStyle("#1D5B9D", "#61B340", 135).experimental_backgroundImage,
    ).toBe("linear-gradient(135deg, #1D5B9D, #61B340)");
  });
});
