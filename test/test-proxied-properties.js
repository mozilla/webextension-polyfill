"use strict";

const {deepEqual, equal, ok} = require("chai").assert;
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("proxies non-configurable read-only properties", () => {
    it("creates a proxy that doesn't raise a Proxy violation exception", () => {
      const fakeChrome = {"devtools": {}};

      // Override the property to make it non-configurable (needed to be sure that
      // the polyfill is correctly workarounding the Proxy TypeError).
      Object.defineProperty(fakeChrome, "devtools", {
        enumarable: true,
        configurable: false,
        writable: false,
        value: {
          inspectedWindow: {
            eval: sinon.spy(),
          },
        },
      });

      return setupTestDOMWindow(fakeChrome).then(window => {
        ok(window.browser.devtools.inspectedWindow,
           "The non-configurable read-only property can be accessed");

        const res = window.browser.devtools.inspectedWindow.eval("test");

        ok(fakeChrome.devtools.inspectedWindow.eval.calledOnce,
           "The target API method has been called once");
        ok(res instanceof window.Promise, "The API method has been wrapped");
      });
    });
  });

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
      const fakeChrome = {runtime: {}};
      return setupTestDOMWindow(fakeChrome).then(window => {
        // Test getter/setter behavior for non wrapped properties on
        // an API namespace (because the root target of the Proxy object
        // is an empty object which has the chrome API object as its
        // prototype and the empty object is not exposed outside of the
        // polyfill sources).
        window.browser.runtime.newns = {newkey: "test-value"};

        ok("newns" in window.browser.runtime, "The custom namespace is in the wrapper");
        ok("newns" in window.chrome.runtime, "The custom namespace is in the target");

        equal(window.browser.runtime.newns.newkey, "test-value",
              "Got the expected result from setting a wrapped property name");

        const setRes = window.browser.runtime.newns = {newkey2: "new-value"};
        equal(window.browser.runtime.newns.newkey2, "new-value",
              "The new non-wrapped getter is cached");
        deepEqual(setRes, {newkey2: "new-value"},
                  "Got the expected result from setting a new wrapped property name");
        deepEqual(window.browser.runtime.newns, window.chrome.runtime.newns,
                  "chrome.newns and browser.newns are the same");

        delete window.browser.runtime.newns.newkey2;
        equal(window.browser.runtime.newns.newkey2, undefined,
              "Got the expected result from setting a wrapped property name");
        ok(!("newkey2" in window.browser.runtime.newns),
           "The deleted property is not listed anymore");
      });
    });
  });

  describe("without side effects", () => {
    it("should proxy non-wrapped methods", () => {
      let lazyInitCount = 0;
      const fakeChrome = {
        get runtime() {
          // Chrome lazily initializes API objects by replacing the getter with
          // the value. The initialization is only allowed to occur once,
          // after that `undefined` is returned and a warning is printed.
          // https://chromium.googlesource.com/chromium/src/+/4d6b3a067994ce6dcf0ed9a9efd566c083736952/extensions/renderer/module_system.cc#414
          //
          // The polyfill should invoke the getter only once (on the global chrome object).
          ++lazyInitCount;

          const onMessage = {
            addListener(listener) {
              equal(this, onMessage, "onMessage.addListener should be called on the original chrome.onMessage object");
            },
          };
          const value = {onMessage};
          Object.defineProperty(this, "runtime", {value});
          return value;
        },
      };
      return setupTestDOMWindow(fakeChrome).then(window => {
        equal(lazyInitCount, 0, "chrome.runtime should not be initialized without explicit API call");

        window.browser.runtime.onMessage.addListener(() => {});
        equal(lazyInitCount, 1, "chrome.runtime should be initialized upon accessing browser.runtime");

        window.browser.runtime.onMessage.addListener(() => {});
        equal(lazyInitCount, 1, "chrome.runtime should be re-used upon accessing browser.runtime");

        window.chrome.runtime.onMessage.addListener(() => {});
        equal(lazyInitCount, 1, "chrome.runtime should be re-used upon accessing chrome.runtime");
      });
    });
  });
});
