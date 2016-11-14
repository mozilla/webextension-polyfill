"use strict";

const {deepEqual, equal, ok} = require("chai").assert;
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("proxies non-wrapped functions", () => {
    it("should proxy non-wrapped methods", () => {
      const fakeChrome = {
        runtime: {
          nonwrappedmethod: sinon.spy(),
        },
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        ok(window.browser.runtime.nonwrappedmethod);

        const fakeCallback = () => {};
        window.browser.runtime.nonwrappedmethod(fakeCallback);

        const receivedCallback = fakeChrome.runtime.nonwrappedmethod.firstCall.args[0];

        equal(fakeCallback, receivedCallback,
              "The callback has not been wrapped for the nonwrappedmethod");
      });
    });

    it("should proxy getters and setters", () => {
      const fakeChrome = {
        runtime: {myprop: "previous-value"},
        nowrapns: {
          nowrapkey: "previous-value",
          nowrapkey2: "previous-value",
        },
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        // Check that the property values on the generated wrapper.
        equal(window.browser.runtime.myprop, "previous-value",
              "Got the expected result from setting a wrapped property name");
        equal(window.browser.nowrapns.nowrapkey, "previous-value",
              "Got the expected result from setting a wrapped property name");

        // Update the properties on the generated wrapper.
        const setResult = window.browser.runtime.myprop = "new-value";
        const setResult2 = window.browser.nowrapns.nowrapkey = "new-value";

        // Check the results of setting the new value of the wrapped properties.
        equal(setResult, "new-value",
              "Got the expected result from setting a wrapped property name");
        equal(setResult2, "new-value",
              "Got the expected result from setting a wrapped property name");

        // Verify that the wrapped properties has been updated.
        equal(window.browser.runtime.myprop, "new-value",
              "Got the expected updated value from the browser property");
        equal(window.browser.nowrapns.nowrapkey, "new-value",
              "Got the expected updated value from the browser property");

        // Verify that the target properties has been updated.
        equal(window.chrome.runtime.myprop, "new-value",
              "Got the expected updated value on the related chrome property");
        equal(window.chrome.nowrapns.nowrapkey, "new-value",
              "Got the expected updated value on the related chrome property");

        // Set a property multiple times before read.
        window.browser.nowrapns.nowrapkey2 = "new-value2";
        window.browser.nowrapns.nowrapkey2 = "new-value3";

        equal(window.chrome.nowrapns.nowrapkey2, "new-value3",
              "Got the expected updated value on the related chrome property");
        equal(window.browser.nowrapns.nowrapkey2, "new-value3",
              "Got the expected updated value on the wrapped property");
      });
    });

    it("deletes proxy getter/setter that are not wrapped", () => {
      const fakeChrome = {};
      return setupTestDOMWindow(fakeChrome).then(window => {
        window.browser.newns = {newkey: "test-value"};

        ok("newns" in window.browser, "The custom namespace is in the wrapper");
        ok("newns" in window.chrome, "The custom namespace is in the target");

        equal(window.browser.newns.newkey, "test-value",
              "Got the expected result from setting a wrapped property name");

        const setRes = window.browser.newns = {newkey2: "new-value"};
        equal(window.browser.newns.newkey2, "new-value",
              "The new non-wrapped getter is cached");
        deepEqual(setRes, {newkey2: "new-value"},
                  "Got the expected result from setting a new wrapped property name");
        deepEqual(window.browser.newns, window.chrome.newns,
                  "chrome.newns and browser.newns are the same");

        delete window.browser.newns.newkey2;
        equal(window.browser.newns.newkey2, undefined,
              "Got the expected result from setting a wrapped property name");
        ok(!("newkey2" in window.browser.newns),
           "The deleted property is not listed anymore");
      });
    });
  });
});
