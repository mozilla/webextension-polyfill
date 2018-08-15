"use strict";

const fs = require("fs");
const {createInstrumenter} = require("istanbul-lib-instrument");
const {jsdom, createVirtualConsole} = require("jsdom");

var virtualConsole = createVirtualConsole();

// Optionally print console logs from the jsdom window.
if (process.env.ENABLE_JSDOM_CONSOLE == "y") {
  virtualConsole.sendTo(console);
}

// Path to the browser-polyfill script, relative to the current work dir
// where mocha is executed.
let BROWSER_POLYFILL_PATH = "./dist/browser-polyfill.js";

if (process.env.TEST_MINIFIED_POLYFILL) {
  BROWSER_POLYFILL_PATH = "./dist/browser-polyfill.min.js";
} else if (process.env.TEST_BUNDLED_POLYFILL) {
  BROWSER_POLYFILL_PATH = process.env.TEST_BUNDLED_POLYFILL;
}

// Create the jsdom window used to run the tests
const testDOMWindow = jsdom("", {virtualConsole}).defaultView;

// Copy the code coverage of the browser-polyfill script from the jsdom window
// to the nodejs global, where nyc expects to find the code coverage data to
// render in the reports.
after(() => {
  if (testDOMWindow && process.env.COVERAGE == "y") {
    global.__coverage__ = testDOMWindow.__coverage__;
  }
});

function setupTestDOMWindow(chromeObject, browserObject = undefined) {
  return new Promise((resolve, reject) => {
    const window = testDOMWindow;

    // Inject the fake chrome object used as a fixture for the particular
    // browser-polyfill test scenario.
    window.chrome = chromeObject;

    // Set (or reset) the browser property.
    if (browserObject) {
      // Make the fake browser object a `window.Object` instance, so that
      // it passes the `Object.getPrototypeOf(browser) !== Object.prototype`
      // check, otherwise it is going to be overridden by the polyfill (See #153).
      window.browser = Object.assign(window.Object(), browserObject);
    } else {
      delete window.browser;
    }

    const scriptEl = window.document.createElement("script");

    if (process.env.COVERAGE == "y") {
      // If the code coverage is enabled, instrument the code on the fly
      // before executing it in the jsdom window.
      const inst = createInstrumenter({
        compact: false, esModules: false, produceSourceMap: false,
      });
      const scriptContent = fs.readFileSync(BROWSER_POLYFILL_PATH, "utf-8");
      scriptEl.textContent = inst.instrumentSync(scriptContent, BROWSER_POLYFILL_PATH);
    } else {
      scriptEl.src = BROWSER_POLYFILL_PATH;
    }

    let onLoad;
    let onLoadError;
    let onError;

    let cleanLoadListeners = () => {
      scriptEl.removeEventListener("load", onLoad);
      scriptEl.removeEventListener("error", onLoadError);

      window.removeEventListener("error", onError);
    };

    onLoad = () => { cleanLoadListeners(); resolve(window); };
    onLoadError = () => {
      cleanLoadListeners();
      reject(new Error(`Error loading script: ${BROWSER_POLYFILL_PATH}`));
    };
    onError = (err) => { cleanLoadListeners(); reject(err); };

    // Listen to any uncaught errors.
    window.addEventListener("error", onError);
    scriptEl.addEventListener("error", onLoadError);

    scriptEl.addEventListener("load", onLoad);

    window.document.body.appendChild(scriptEl);
  });
}

module.exports = {
  BROWSER_POLYFILL_PATH,
  setupTestDOMWindow,
};
