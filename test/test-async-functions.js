"use strict";

const {deepEqual, equal, fail, throws} = require("chai").assert;
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
        equal(results[0], "res1", "Fake alarms.clear call resolved to a single value");
        deepEqual(results[1], ["res1", "res2"],
                  "Fake tabs.query resolved to an array of values");
        deepEqual(results[2], ["res1", "res2"],
                  "Fake runtime.requestUpdateCheck resolved to an array of values");
      });
    });

    it("rejects the returned promise if chrome.runtime.lastError is not null", () => {
      const fakeChrome = {
        runtime: {
          lastError: new Error("fake lastError"),
        },
        tabs: {
          query: sinon.stub(),
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        // Test for single array callback argument.
        fakeChrome.tabs.query
          .onFirstCall().callsArgWith(1, ["res1", "res2"]);

        return window.browser.tabs.query({active: true}).then(
          () => fail("Expected a rejected promise"),
          (err) => equal(err, fakeChrome.runtime.lastError,
                         "Got the expected error in the rejected promise")
        );
      });
    });

    it("throws if the number of arguments are not in the range defined in the metadata", () => {
      const fakeChrome = {
        runtime: {
          lastError: null,
          sendMessage: sinon.spy(),
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        throws(() => {
          window.browser.runtime.sendMessage();
        }, "Expected at least 1 argument for sendMessage(), got 0");

        throws(() => {
          window.browser.runtime.sendMessage("0", "1", "2", "3");
        }, "Expected at most 3 arguments for sendMessage(), got 4");
      });
    });
  });
});
