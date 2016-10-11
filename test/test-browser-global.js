"use strict";

const {assert} = require("chai");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  it("wraps the global chrome namespace with a global browser namespace", () => {
    const fakeChrome = {};
    return setupTestDOMWindow(fakeChrome).then(window => {
      assert.equal(typeof window.browser, "object", "Got the window.browser object");
    });
  });
});
