"use strict";

const {deepEqual, equal, ok} = require("chai").assert;

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  it("throws an error in a non-extension environment", async () => {
    try {
      await setupTestDOMWindow(null);
      ok(false, "The polyfill script should have failed to load.");
    } catch (e) {
      equal(e.message,
            "This script should only be loaded in a browser extension.",
            "Expected script to not load in a non-extension environment");
    }
  });

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
      runtime: {id: "fakeid"},
    };

    return setupTestDOMWindow(fakeChrome, fakeBrowser).then(window => {
      deepEqual(window.browser, fakeBrowser,
                "The existing browser has not been wrapped");
    });
  });

  describe("browser wrapper", () => {
    it("supports custom properties defined using Object.defineProperty", () => {
      const fakeChrome = {};
      return setupTestDOMWindow(fakeChrome).then(window => {
        Object.defineProperty(window.browser, "myns", {
          enumerable: true,
          configurable: true,
          value: {mykey: true},
        });

        ok("myns" in window.browser, "The custom property exists");
        ok("mykey" in window.browser.myns,
           "The content of the custom property exists");

        deepEqual(window.browser.myns, {mykey: true},
                  "The custom property has the expected content");

        delete window.browser.myns;

        ok(!("myns" in window.browser),
           "The deleted custom defined property has been removed");
      });
    });

    it("returns undefined for property undefined in the target", () => {
      const fakeChrome = {myns: {mychromekey: true}};
      return setupTestDOMWindow(fakeChrome).then(window => {
        equal(window.browser.myns.mychromekey, true,
              "Got the expected result from a wrapped property");
        equal(window.browser.myns.nonexistent, undefined,
              "Got undefined for non existent property");
        equal(window.browser.nonexistent, undefined,
              "Got undefined for non existent namespaces");
      });
    });
  });
});
