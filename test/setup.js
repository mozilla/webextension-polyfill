"use strict";

const {createInstrumenter} = require("istanbul-lib-instrument");
const fs = require("fs");
const {jsdom, createVirtualConsole} = require("jsdom");

var virtualConsole = createVirtualConsole().sendTo(console);

// Path to the browser-polyfill script, relative to the current work dir
// where mocha is executed.
const BROWSER_POLYFILL_PATH = "./dist/browser-polyfill.js";

function setupTestDOMWindow(chromeObject) {
  return new Promise((resolve, reject) => {
    let window;

    // If a jsdom window has already been created, reuse it so that
    // we can retrieve the final code coverage data, which has been
    // collected in the jsdom window (where the instrumented browser-polyfill
    // is running).
    if (global.window) {
      window = global.window;
      window.browser = undefined;
    } else {
      window = jsdom({virtualConsole}).defaultView;
      global.window = window;
    }

    // Inject the fake chrome object used as a fixture for the particular
    // browser-polyfill test scenario.
    window.chrome = chromeObject;

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

    // Prepare to listen for script loading errors (which results in a rejection),
    // and to detect when the browser-polyfill has been executed (which resolves
    // to the jsdom window where the loading has been completed).
    window.__browserPolyfillLoaded__ = {resolve, reject};
    window.addEventListener("error", (evt) => reject(evt));
    const loadedScriptEl = window.document.createElement("script");
    loadedScriptEl.textContent = `
      window.removeEventListener("error", window.__browserPolyfillLoaded__.reject);
      window.__browserPolyfillLoaded__.resolve(window);
    `;

    window.document.body.appendChild(scriptEl);
    window.document.body.appendChild(loadedScriptEl);
  });
}

// Copy the code coverage of the browser-polyfill script from the jsdom window
// to the nodejs global, where nyc expects to find the code coverage data to
// render in the reports.
after(() => {
  if (global.window && process.env.COVERAGE == "y") {
    global.__coverage__ = global.window.__coverage__;
  }
});

module.exports = {
  BROWSER_POLYFILL_PATH,
  setupTestDOMWindow,
};
