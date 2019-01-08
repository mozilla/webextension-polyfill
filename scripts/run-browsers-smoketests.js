#!/usr/bin/env node
const shell = require("shelljs");

let result = 0;

console.log(`
Test webextension-polyfill on real browsers
===========================================`);

// Enable headless mode (currently only used when running on Firefox
// because Chrome doesn't currently support the extensions in headless mode)
process.env.HEADLESS = 1;

console.log(`
Runing smoketests on Chrome`);
process.env.TEST_BROWSER_TYPE = "chrome";
result = shell.exec("npm run test-integration:chrome").code || result;

console.log(`
Running smoketests on Firefox`);
process.env.TEST_BROWSER_TYPE = "firefox";
result = shell.exec("npm run test-integration:firefox").code || result;

process.exit(result);
