"use strict";

const {assert} = require("chai");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("proxies non-wrapped functions", () => {
    it("should proxy getters and setters", () => {
      const fakeChrome = {
        runtime: {myprop: "previous-value"},
        nowrapns: {nowrapkey: "previous-value"},
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        const setResult = window.browser.runtime.myprop = "new-value";
        const setResult2 = window.browser.nowrapns.nowrapkey = "new-value";

        assert.equal(setResult, "new-value",
                     "Got the expected result from setting a wrapped property name");
        assert.equal(setResult2, "new-value",
                     "Got the expected result from setting a wrapped property name");
      });
    });

    it("delete proxy getter/setter that are not wrapped", () => {
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
      });
    });
  });
});
