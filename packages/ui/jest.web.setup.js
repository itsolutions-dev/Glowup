/* global jest */
// The web project (src/__web_tests__) renders through react-native-web into
// jsdom. @expo/vector-icons loads its font through expo-font, which looks the
// file up in Metro's asset registry; under jest there is none, and the lookup
// throws after the test and takes the worker down. The tests read roles and
// attributes, not glyphs: the font counts as loaded.
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
