// Only jest-expo needs this: `bob build` uses its own babel config. `lazyImports`
// matters — the barrel re-exports DrawerContent, so an eager transform pulls
// @react-navigation/drawer → reanimated → react-native-worklets into every test
// run, and worklets' native initializers throw under jest.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { lazyImports: true }]],
  };
};
