"use strict";

const {assert} = require("chai");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("proxies non-wrapped functions", () => {
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
        assert.equal(window.browser.runtime.myprop, "previous-value",
                     "Got the expected result from setting a wrapped property name");
        assert.equal(window.browser.nowrapns.nowrapkey, "previous-value",
                     "Got the expected result from setting a wrapped property name");

        // Update the properties on the generated wrapper.
        const setResult = window.browser.runtime.myprop = "new-value";
        const setResult2 = window.browser.nowrapns.nowrapkey = "new-value";

        // Check the results of setting the new value of the wrapped properties.
        assert.equal(setResult, "new-value",
                     "Got the expected result from setting a wrapped property name");
        assert.equal(setResult2, "new-value",
                     "Got the expected result from setting a wrapped property name");

        // Verify that the wrapped properties has been updated.
        assert.equal(window.browser.runtime.myprop, "new-value",
                     "Got the expected updated value from the browser property");
        assert.equal(window.browser.nowrapns.nowrapkey, "new-value",
                     "Got the expected updated value from the browser property");

        // Verify that the target properties has been updated.
        assert.equal(window.chrome.runtime.myprop, "new-value",
                     "Got the expected updated value on the related chrome property");
        assert.equal(window.chrome.nowrapns.nowrapkey, "new-value",
                     "Got the expected updated value on the related chrome property");

        // Set a property multiple times before read.
        window.browser.nowrapns.nowrapkey2 = "new-value2";
        window.browser.nowrapns.nowrapkey2 = "new-value3";

        assert.equal(window.chrome.nowrapns.nowrapkey2, "new-value3",
                     "Got the expected updated value on the related chrome property");
        assert.equal(window.browser.nowrapns.nowrapkey2, "new-value3",
                     "Got the expected updated value on the wrapped property");
      });
    });

    it("deletes proxy getter/setter that are not wrapped", () => {
      const fakeChrome = {};
      return setupTestDOMWindow(fakeChrome).then(window => {
        window.browser.newns = {newkey: "test-value"};
        assert.equal(window.browser.newns.newkey, "test-value",
                     "Got the expected result from setting a wrapped property name");

        const setRes = window.browser.newns = {newkey2: "new-value"};
        assert.equal(window.browser.newns.newkey2, "new-value",
                     "The new non-wrapped getter is cached");
        assert.deepEqual(setRes, {newkey2: "new-value"},
                     "Got the expected result from setting a new wrapped property name");
        assert.deepEqual(window.browser.newns, window.chrome.newns,
                         "chrome.newns and browser.newns are the same");


        delete window.browser.newns.newkey2;
        assert.equal(window.browser.newns.newkey2, undefined,
                     "Got the expected result from setting a wrapped property name");
        assert.ok(!("newkey2" in window.browser.newns),
                  "The deleted property is not listed anymore");
      });
    });
  });
});
