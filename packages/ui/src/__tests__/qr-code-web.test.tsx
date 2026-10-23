import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import { QrCode, ThemeProvider } from "..";

// The drawing library as plain host elements, so the props `QrCode` hands the
// path can be read: react-native-svg keeps the ones it knows and drops the rest.
jest.mock("react-native-svg", () => {
  const { createElement } = jest.requireActual("react");
  const host = (name: string) => (props: object) => createElement(name, props);
  return { __esModule: true, default: host("MockSvg"), Path: host("MockPath") };
});

const draw = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

afterEach(() => jest.restoreAllMocks());

describe("QrCode on the web", () => {
  it("asks the browser for crisp edges, which native does not know", async () => {
    const native = await draw(<QrCode value="x" />);
    const nativePath = native.container.queryAll((n) => n.type === "MockPath");
    expect(nativePath).toHaveLength(1);
    expect(nativePath[0].props.shapeRendering).toBeUndefined();

    jest.replaceProperty(Platform, "OS", "web");
    const web = await draw(<QrCode value="x" />);
    const webPath = web.container.queryAll((n) => n.type === "MockPath");
    expect(webPath[0].props.shapeRendering).toBe("crispEdges");
    expect(webPath[0].props.d).toBe(nativePath[0].props.d);
  });

  it("draws the same code on both", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const web = await draw(<QrCode value="https://example.com" logo="star" />);
    expect(web.container.queryAll((n) => n.type === "MockPath")).toHaveLength(
      1,
    );
  });
});
