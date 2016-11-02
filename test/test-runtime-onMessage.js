"use strict";

const {deepEqual, equal, ok} = require("chai").assert;
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped runtime.onMessage listener", () => {
    it("does not wrap the listener if it is not a function", () => {
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy(),
            hasListener: sinon.stub(),
            removeListener: sinon.spy(),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const fakeNonFunctionListener = {fake: "non function listener"};

        window.browser.runtime.onMessage.addListener(fakeNonFunctionListener);

        deepEqual(fakeChrome.runtime.onMessage.addListener.firstCall.args[0],
                  fakeNonFunctionListener,
                  "The non-function listener has not been wrapped");
      });
    });

    it("keeps track of the listeners added", () => {
      const messageListener = sinon.spy();
      const fakeChromeListeners = new Set();
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy((listener, ...args) => {
              fakeChromeListeners.add(listener);
            }),
            hasListener: sinon.spy(listener => fakeChromeListeners.has(listener)),
            removeListener: sinon.spy(listener => {
              fakeChromeListeners.delete(listener);
            }),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        equal(window.browser.runtime.onMessage.hasListener(messageListener),
              false, "Got hasListener==false before the listener has been added");

        window.browser.runtime.onMessage.addListener(messageListener);

        equal(window.browser.runtime.onMessage.hasListener(messageListener),
              true, "Got hasListener==true once the listener has been added");

        // Add the same listener again to test that it will be called with the
        // same wrapped listener.
        window.browser.runtime.onMessage.addListener(messageListener);

        ok(fakeChrome.runtime.onMessage.addListener.calledTwice,
           "addListener has been called twice");
        equal(fakeChrome.runtime.onMessage.addListener.secondCall.args[0],
              fakeChrome.runtime.onMessage.addListener.firstCall.args[0],
              "both the addListener calls received the same wrapped listener");

        // Retrieve the wrapped listener and execute it to fake a received message.
        const wrappedListener = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];
        wrappedListener("msg", {name: "sender"}, function sendResponse() {});
        ok(messageListener.calledOnce, "The listener has been called once");

        // Remove the listener.
        window.browser.runtime.onMessage.removeListener(messageListener);
        ok(fakeChrome.runtime.onMessage.removeListener.calledOnce,
           "removeListener has been called once");
        equal(fakeChrome.runtime.onMessage.addListener.secondCall.args[0],
              fakeChrome.runtime.onMessage.removeListener.firstCall.args[0],
              "both the addListener and removeListenercalls received the same wrapped listener");
        equal(fakeChrome.runtime.onMessage.hasListener(messageListener), false,
              "Got hasListener==false once the listener has been removed");
      });
    });

    it("sends the returned value as a message response", () => {
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy(),
          },
        },
      };

      // Plain value returned.
      const messageListener = sinon.stub();
      const firstResponse = "fake reply";
      // Resolved Promise returned.
      const secondResponse = Promise.resolve("fake reply 2");
      // Rejected Promise returned.
      const thirdResponse = Promise.reject("fake error 3");

      const sendResponseSpy = sinon.spy();

      messageListener
        .onFirstCall().returns(firstResponse)
        .onSecondCall().returns(secondResponse)
        .onThirdCall().returns(thirdResponse);

      let wrappedListener;

      return setupTestDOMWindow(fakeChrome).then(window => {
        window.browser.runtime.onMessage.addListener(messageListener);

        ok(fakeChrome.runtime.onMessage.addListener.calledOnce);

        wrappedListener = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];

        wrappedListener("fake message", {name: "fake sender"}, sendResponseSpy);

        ok(messageListener.calledOnce, "The unwrapped message listener has been called");
        deepEqual(messageListener.firstCall.args,
                         ["fake message", {name: "fake sender"}],
                  "The unwrapped message listener has received the expected parameters");

        ok(sendResponseSpy.calledOnce, "The sendResponse function has been called");
        equal(sendResponseSpy.firstCall.args[0], "fake reply",
              "sendResponse callback has been called with the expected parameters");

        wrappedListener("fake message2", {name: "fake sender2"}, sendResponseSpy);

        // Wait the second response promise to be resolved.
        return secondResponse;
      }).then(() => {
        ok(messageListener.calledTwice,
           "The unwrapped message listener has been called");
        deepEqual(messageListener.secondCall.args,
                         ["fake message2", {name: "fake sender2"}],
                  "The unwrapped listener has received the expected parameters");

        ok(sendResponseSpy.calledTwice, "The sendResponse function has been called");
        equal(sendResponseSpy.secondCall.args[0], "fake reply 2",
              "sendResponse callback has been called with the expected parameters");
      }).then(() => {
        wrappedListener("fake message3", {name: "fake sender3"}, sendResponseSpy);

        // Wait the third response promise to be rejected.
        return thirdResponse.catch(err => {
          equal(messageListener.callCount, 3,
                "The unwrapped message listener has been called");
          deepEqual(messageListener.thirdCall.args,
                           ["fake message3", {name: "fake sender3"}],
                    "The unwrapped listener has received the expected parameters");

          equal(sendResponseSpy.callCount, 3,
                "The sendResponse function has been called");
          equal(sendResponseSpy.thirdCall.args[0], err,
                "sendResponse callback has been called with the expected parameters");
        });
      });
    });
  });
});
