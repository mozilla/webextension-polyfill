"use strict";

const {deepEqual, equal, fail, ok, throws} = require("chai").assert;
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped async functions", () => {
    it("returns a promise which resolves to the callback parameters", () => {
      const fakeChrome = {
        alarms: {clear: sinon.stub()},
        runtime: {
          lastError: null,
          openOptionsPage: sinon.stub(),
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

        // Test for no callback arguments.
        fakeChrome.runtime.openOptionsPage
          .onFirstCall().callsArg(0);

        return Promise.all([
          window.browser.alarms.clear("test1"),
          window.browser.tabs.query({active: true}),
          window.browser.runtime.requestUpdateCheck(),
          window.browser.runtime.openOptionsPage(),
        ]);
      }).then(results => {
        equal(results[0], "res1", "Fake alarms.clear call resolved to a single value");
        deepEqual(results[1], ["res1", "res2"],
                  "Fake tabs.query resolved to an array of values");
        deepEqual(results[2], ["res1", "res2"],
                  "Fake runtime.requestUpdateCheck resolved to an array of values");

        equal(results[3], undefined, "Fake runtime.openOptionsPage resolved to a void value.");
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

    it("resolves to a single parameter on singleCallbackArg metadata property", () => {
      const fakeChrome = {
        runtime: {lastError: null},
        devtools: {
          panels: {
            create: sinon.spy((title, iconPath, panelURL, cb) => {
              // when the callback of a API method which specifies the "singleCallbackArg" metadata
              // is called with two parameters only the first one is resolved by the returned promise.
              Promise.resolve().then(() => {
                cb({isFakePanel: true}, "unwanted parameter");
              });
            }),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(({browser}) => {
        return browser.devtools.panels.create("title", "icon.png", "panel.html").then(panel => {
          ok(fakeChrome.devtools.panels.create.calledOnce,
             "devtools.panels.create has been called once");

          ok("isFakePanel" in panel && panel.isFakePanel,
             "Got the expected result from devtools.panels.create");
        });
      });
    });

    it("resolves to a single undefined parameter on singleCallbackArg metadata and no params", () => {
      const fakeChrome = {
        runtime: {lastError: null},
        devtools: {
          panels: {
            create: sinon.spy((title, iconPath, panelURL, cb) => {
              Promise.resolve().then(() => {
                // when the callback of a API method which specifies the "singleCallbackArg" metadata
                // is called without any parameter, the returned promise resolves to undefined
                // instead of an empty array.
                cb();
              });
            }),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(({browser}) => {
        return browser.devtools.panels.create("title", "icon.png", "panel.html").then(panel => {
          ok(fakeChrome.devtools.panels.create.calledOnce,
             "devtools.panels.create has been called once");

          ok(panel === undefined,
             "Got the expected undefined result from devtools.panels.create");
        });
      });
    });

    it("returns a Promise for wrapped API methods without a callback on Chrome", () => {
      const FAKE_ERROR_MSG = "API Schema validation error";

      const fakeChrome = {
        runtime: {lastError: null},
        pageAction: {
          show: sinon.spy((tabId, cb) => {
            if (cb) {
              throw new Error("Chrome do not expect a callback");
            }

            if (tabId == null) {
              throw new Error(FAKE_ERROR_MSG);
            }
          }),
          hide: sinon.spy((tabId, cb) => {
            if (cb) {
              throw new Error("Chrome do not expect a callback");
            }

            if (tabId == null) {
              throw new Error(FAKE_ERROR_MSG);
            }
          }),
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const {browser, Promise} = window;

        const pageActionShowPromise = browser.pageAction.show(1).catch(err => err);
        const pageActionHidePromise = browser.pageAction.hide(undefined).catch(err => err);

        ok(pageActionShowPromise instanceof Promise,
           "browser.pageAction.show returned a promise instance");
        ok(pageActionHidePromise instanceof Promise,
           "browser.pageAction.hide returned a promise instance");

        return Promise.all([
          pageActionShowPromise, pageActionHidePromise,
        ]).then(([pageActionShowResolved, pageActionHideRejected]) => {
          ok(fakeChrome.pageAction.show.calledTwice, "chrome.pageAction.show has been called twice");
          equal(fakeChrome.pageAction.show.firstCall.args.length, 2,
                "chrome.pageAction.show first call has received a callback parameter");
          equal(fakeChrome.pageAction.show.secondCall.args.length, 1,
                "chrome.pageAction.show second call has received a single parameter");
          equal(pageActionShowResolved, undefined, "pageAction.show resolved successfully");

          ok(fakeChrome.pageAction.hide.calledTwice, "chrome.pageAction.hide has been called twice");
          equal(fakeChrome.pageAction.hide.firstCall.args.length, 2,
                "chrome.pageAction.hide first call has received a callback parameter");
          equal(fakeChrome.pageAction.hide.secondCall.args.length, 1,
                "chrome.pageAction.hide second call has received a single parameter");

          ok(pageActionHideRejected instanceof Error,
             "browser.pageAction.hide rejected value is an Error instance");
          equal(pageActionHideRejected.message, FAKE_ERROR_MSG,
                "browser.pageAction.hide rejected error has the expected message");
        }).then(() => {
          // Call pageAction.show and hide again to ensure that only after a successfull
          // API call the wrapper will always call the API method without the callback parameter.

          fakeChrome.pageAction.show.reset();
          fakeChrome.pageAction.hide.reset();

          const secondPageActionShowPromise = browser.pageAction.show(1).catch(err => err);
          const secondPageActionHidePromise = browser.pageAction.hide(undefined).catch(err => err);

          return Promise.all([secondPageActionShowPromise, secondPageActionHidePromise]);
        }).then(([pageActionShowResolved, pageActionHideRejected]) => {
          ok(fakeChrome.pageAction.show.calledOnce, "chrome.pageAction.show has been called once");
          equal(fakeChrome.pageAction.show.firstCall.args.length, 1,
                "chrome.pageAction.show call has not received a callback parameter");

          ok(fakeChrome.pageAction.hide.calledTwice, "chrome.pageAction.hide has been called twice");
          equal(fakeChrome.pageAction.hide.firstCall.args.length, 2,
                "chrome.pageAction.hide first call has received a callback parameter");
          equal(fakeChrome.pageAction.hide.secondCall.args.length, 1,
                "chrome.pageAction.hide second call has received a single parameter");

          ok(pageActionHideRejected instanceof Error,
             "browser.pageAction.hide rejected value is an Error instance");
          equal(pageActionHideRejected.message, FAKE_ERROR_MSG,
                "browser.pageAction.hide rejected error has the expected message");
        });
      });
    });
  });
});
