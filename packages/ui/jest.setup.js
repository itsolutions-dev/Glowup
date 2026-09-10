// jest-expo's babel transform requires node_modules lazily, so importing
// @testing-library/react-native from inside a test file registers its
// afterEach/beforeAll cleanup hooks during the first test rather than at load
// time, which jest-circus rejects. Requiring it here evaluates it up front.
require("@testing-library/react-native");
