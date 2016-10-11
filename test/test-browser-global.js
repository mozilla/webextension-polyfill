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

  it("do not override the global browser namespace if it already exists", () => {
    const fakeChrome = {
      runtime: {lastError: null},
    };
    const fakeBrowser = {
      mycustomns: {mykey: true},
    };

    return setupTestDOMWindow(fakeChrome, fakeBrowser).then(window => {
      assert.deepEqual(window.browser, fakeBrowser,
                       "The existent browser has not been wrapped");
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

        assert.ok("myns" in window.browser, "The custom property exists");
        assert.ok("mykey" in window.browser.myns,
                  "The content of the custom property exists");

        assert.deepEqual(window.browser.myns, {mykey: true},
                        "The custom property has the expected content");

        delete window.browser.myns;

        assert.ok(!("myns" in window.browser),
                  "The deleted custom defined property has been removed");
      });
    });

    it("returns undefined for property undefined in the target", () => {
      const fakeChrome = {myns: {mykey: true}};
      return setupTestDOMWindow(fakeChrome).then(window => {
        assert.equal(window.browser.myns.mykey, true,
                     "Got the expected result from a wrapped property");
        assert.equal(window.browser.myns.nonexistent, undefined,
                     "Got undefined for non existent property");
        assert.equal(window.browser.nonexistent, undefined,
                     "Got undefined for non existent namespaces");
      });
    });
  });
});
