"use strict";

const {assert} = require("chai");
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped async functions", () => {
    it("returns a promise which resolves to the callback parameters", () => {
      const fakeChrome = {
        alarms: {clear: sinon.stub()},
        runtime: {lastError: undefined},
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        fakeChrome.alarms.clear
          .onFirstCall().callsArgWith(1, "res1")
          .onSecondCall().callsArgWith(1, "res1", "res2", "res3");

        return Promise.all([
          window.browser.alarms.clear("test1"),
          window.browser.alarms.clear("test2"),
        ]);
      }).then(results => {
        assert.equal(results[0], "res1", "The first call resolved to a single value");
        assert.deepEqual(results[1], ["res1", "res2", "res3"],
                         "The second call resolved to an array of the expected values");
      });
    });
  });
});
