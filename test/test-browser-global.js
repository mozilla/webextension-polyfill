"use strict";

const {assert} = require("chai");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  it("automatically wrapps chrome into a browser object", () => {
    const fakeChrome = {};
    return setupTestDOMWindow(fakeChrome).then(window => {
      assert.equal(typeof window.browser, "object", "Got the window.browser object");
    });
  });
});
