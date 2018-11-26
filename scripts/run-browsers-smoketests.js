const shell = require("shelljs");

// set -eo pipefail

console.log(`
Test webextension-polyfill on real browsers
===========================================
`);

if (process.platform == "win32" && process.env.EDGE_DRIVER_PATH) {
  process.env.PATH += `;${process.env.EDGE_DRIVER_PATH}`;
}
// ## HEADLESS=1 Enable the headless mode (currently used only on Firefox
// ## because Chrome doesn't currently support the extensions in headless mode)
process.env.HEADLESS = 1;

console.log("Runing smoketests on Chrome");
process.env.TEST_BROWSER_TYPE = "chrome";
shell.exec("npm run test-integration:chrome");

console.log("Running smoketests on Firefox");
process.env.TEST_BROWSER_TYPE = "firefox";
shell.exec("npm run test-integration:firefox");

if (process.platform == "win32" && process.env.EDGE_DRIVER_PATH) {
  console.log("Run smoketests on Edge");
  process.env.TEST_BROWSER_TYPE = "edge";
  shell.exec("npm run test-integration:edge");
}
