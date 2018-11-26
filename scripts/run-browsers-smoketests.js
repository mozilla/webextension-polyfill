const shell = require("shelljs");

// set -eo pipefail

console.log(`
Test webextension-polyfill on real browsers
===========================================
`);

// ## HEADLESS=1 Enable the headless mode (currently used only on Firefox
// ## because Chrome doesn't currently support the extensions in headless mode)
process.env.HEADLESS = 1;

console.log("Runing smoketests on Chrome");
process.env.TEST_BROWSER_TYPE = "chrome";
shell.exec("npm run test-integration:chrome");

console.log("Running smoketests on Firefox");
process.env.TEST_BROWSER_TYPE = "firefox";
shell.exec("npm run test-integration:firefox");
