"use strict";

const {assert} = require("chai");
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped async functions", () => {
    it("returns a promise which resolves to the callback parameters", () => {
      const fakeChrome = {
        alarms: {clear: sinon.stub()},
        runtime: {
          lastError: null,
          requestUpdateCheck: sinon.stub(),
        },
        tabs: {
          query: sinon.stub(),
        },
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        // Test for single callback argument.
        fakeChrome.alarms.clear
          .onFirstCall().callsArgWith(1, "res1");

        // Test for single array callback argument.
        fakeChrome.tabs.query
          .onFirstCall().callsArgWith(1, ["res1", "res2"]);

        // Test for multiple callback arguments.
        fakeChrome.runtime.requestUpdateCheck
          .onFirstCall().callsArgWith(0, "res1", "res2");

        return Promise.all([
          window.browser.alarms.clear("test1"),
          window.browser.tabs.query({active: true}),
          window.browser.runtime.requestUpdateCheck(),
        ]);
      }).then(results => {
        assert.equal(results[0], "res1", "Fake alarms.clear call resolved to a single value");
        assert.deepEqual(results[1], ["res1", "res2"],
                         "Fake tabs.query resolved to an array of values");
        assert.deepEqual(results[2], ["res1", "res2"],
                         "Fake runtime.requestUpdateCheck resolved to an array of values");
      });
    });
  });
});
