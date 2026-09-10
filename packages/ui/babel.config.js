// Only jest-expo needs this: `bob build` uses its own babel config.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
