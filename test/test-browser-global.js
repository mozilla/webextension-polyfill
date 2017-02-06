"use strict";

const {deepEqual, equal} = require("chai").assert;

const {setupTestDOMWindow} = require("./setup");

const {testCustomProperties, testUndefinedProperties} = require("./helpers");

describe("browser-polyfill", () => {
  it("wraps the global chrome namespace with a global browser namespace", () => {
    const fakeChrome = {};
    return setupTestDOMWindow(fakeChrome).then(window => {
      equal(typeof window.browser, "object", "Got the window.browser object");
    });
  });

  it("does not override the global browser namespace if it already exists", () => {
    const fakeChrome = {
      runtime: {lastError: null},
    };
    const fakeBrowser = {
      mycustomns: {mykey: true},
    };

    return setupTestDOMWindow(fakeChrome, fakeBrowser).then(window => {
      deepEqual(window.browser, fakeBrowser,
                "The existing browser has not been wrapped");
    });
  });

  describe("browser wrapper", () => {
    it("supports custom properties defined using Object.defineProperty", () => {
      const fakeChrome = {};
      return setupTestDOMWindow(fakeChrome).then(testCustomProperties);
    });

    it("returns undefined for property undefined in the target", () => {
      const fakeChrome = {myns: {mykey: true}};
      return setupTestDOMWindow(fakeChrome).then(testUndefinedProperties);
    });
  });
});
