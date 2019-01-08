#!/usr/bin/env node
const shell = require("shelljs");

let result = 0;

console.log(`
Test webextension-polyfill bundled with webpack
===============================================`);

shell.exec("webpack --mode production --entry ./test/fixtures/bundle-entrypoint.js --output /tmp/webpack-bundle.js");
process.env.TEST_BUNDLED_POLYFILL = "/tmp/webpack-bundle.js";
result = shell.exec("npm run test").code || result;

console.log(`
Test webextension-polyfill bundled with browserify
==================================================`);

shell.exec("browserify test/fixtures/bundle-entrypoint.js > /tmp/browserify-bundle.js");
process.env.TEST_BUNDLED_POLYFILL = "/tmp/browserify-bundle.js";
result = shell.exec("npm run test").code || result;

process.exit(result);
