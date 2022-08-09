"use strict";

const fs = require("fs");
const {createInstrumenter} = require("istanbul-lib-instrument");
const jsdom = require("jsdom");

var virtualConsole = new jsdom.VirtualConsole();

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

function getInputSourceMap() {
  // Enabled only on CI until we have fixed the mapping to the source file
  // (by making sure that babel generates a sourcemap that does also take into
  // account the api metadata being interpolated into the src script).
  //
  // TODO(https://github.com/mozilla/webextension-polyfill/issues/348):
  // disabling the sourcemapped code coverage will not be necessary anymore
  // once we fix the generated sourcemap to correctly map to src/browser-polyfill.js
  if (process.env.COVERAGE_WITH_SOURCEMAP != "1") {
    return undefined;
  }
  if (process.env.TEST_BUNDLED_POLYFILL) {
    // Running the unit tests on the bundled files are meant to be used as smoke tests,
    // we don't need to collect code coverage for it.
    throw new Error("Unexpected code coverage enabled while testing bundled modules");
  }
  let sourceMapPath = process.env.TEST_MINIFIED_POLYFILL
    ? "./dist/browser-polyfill.js.min.map"
    : "./dist/browser-polyfill.js.map";
  let sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, {encoding: "utf-8"}));
  sourceMap.sources = ["../src/browser-polyfill.js"];
  return sourceMap;
}

const scriptContent = fs.readFileSync(BROWSER_POLYFILL_PATH, "utf-8");

// Create the jsdom window used to run the tests
const testDOMWindow = new jsdom.JSDOM("", {
  virtualConsole,
  // This option is needed to allow the polyfill script to be executed
  // inside the jsdom window as a tag script (and it is actually the
  // only script executed inside the test jsdom window).
  runScripts: "dangerously",
}).window;

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

    // Ensure that "chrome.runtime.id" is set, because the polyfill is only
    // loaded in extension environments.
    if (chromeObject) {
      if (!chromeObject.runtime) {
        chromeObject.runtime = {};
      }
      if (!chromeObject.runtime.id) {
        chromeObject.runtime.id = "some-test-id-from-test-setup";
      }
    }

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
      scriptEl.textContent = inst.instrumentSync(
        scriptContent,
        BROWSER_POLYFILL_PATH,
        getInputSourceMap()
      );
    } else {
      scriptEl.textContent = scriptContent;
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
