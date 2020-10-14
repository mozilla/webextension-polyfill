#!/usr/bin/env node
const path = require("path");
const shell = require("shelljs");

let result = 0;

console.log(`
Test webextension-polyfill bundled with webpack
===============================================`);

process.env.TEST_BUNDLED_POLYFILL = "/tmp/webpack-bundle.js";
const webpackOutputDir = path.dirname(process.env.TEST_BUNDLED_POLYFILL);
const webpackOutputFilename = path.basename(process.env.TEST_BUNDLED_POLYFILL);

result = shell.exec(`webpack --mode production --entry ./test/fixtures/bundle-entrypoint.js --output-path ${webpackOutputDir} --output-filename ${webpackOutputFilename}`).code ||
  shell.exec("npm run test").code || result;

console.log(`
Test webextension-polyfill bundled with browserify
==================================================`);

process.env.TEST_BUNDLED_POLYFILL = "/tmp/browserify-bundle.js";
result = shell.exec(`browserify test/fixtures/bundle-entrypoint.js > ${process.env.TEST_BUNDLED_POLYFILL}`).code ||
  shell.exec("npm run test").code || result;

process.exit(result);
