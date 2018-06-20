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

    it("generates different wrappers for different listeners", () => {
      const fakeChromeListeners = [];
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy((listener, ...args) => {
              fakeChromeListeners.push(listener);
            }),
            hasListener: sinon.spy(),
            removeListener: sinon.spy(),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const firstMessageListener = sinon.spy();
        const secondMessageListener = sinon.spy();

        window.browser.runtime.onMessage.addListener(firstMessageListener);
        window.browser.runtime.onMessage.addListener(secondMessageListener);

        equal(fakeChromeListeners.length, 2, "Got two wrapped listeners");

        fakeChromeListeners[0]("call first wrapper");
        ok(firstMessageListener.calledOnce);
        equal(firstMessageListener.firstCall.args[0], "call first wrapper");

        fakeChromeListeners[1]("call second wrapper");
        ok(secondMessageListener.calledOnce);
        equal(secondMessageListener.firstCall.args[0], "call second wrapper");
      });
    });
  });

  describe("sendResponse callback", () => {
    it("ignores the sendResponse calls when the listener returns a promise", () => {
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy(),
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const listener = sinon.spy((msg, sender, sendResponse) => {
          sendResponse("Ignored sendReponse callback on returned Promise");

          return Promise.resolve("listener resolved value");
        });

        const sendResponseSpy = sinon.spy();

        window.browser.runtime.onMessage.addListener(listener);

        ok(fakeChrome.runtime.onMessage.addListener.calledOnce,
           "runtime.onMessage.addListener should have been called once");

        let wrappedListener = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];

        let returnedValue = wrappedListener("test message", {name: "fake sender"}, sendResponseSpy);
        equal(returnedValue, true, "the wrapped listener should have returned true");

        ok(listener.calledOnce, "listener has been called once");

        // Wait a promise to be resolved and then check the wrapped listener behaviors.
        return Promise.resolve().then(() => {
          ok(sendResponseSpy.calledOnce, "sendResponse callback called once");

          equal(sendResponseSpy.firstCall.args[0], "listener resolved value",
                "sendResponse has been called with the expected value");
        });
      });
    });

    it("ignores asynchronous sendResponse calls if the listener does not return true", () => {
      const fakeChrome = {
        runtime: {
          lastError: null,
          onMessage: {
            addListener: sinon.spy(),
          },
        },
      };

      const waitPromises = [];

      return setupTestDOMWindow(fakeChrome).then(window => {
        const listenerReturnsFalse = sinon.spy((msg, sender, sendResponse) => {
          waitPromises.push(Promise.resolve().then(() => {
            sendResponse("Ignored sendReponse callback on returned false");
          }));

          return false;
        });

        const listenerReturnsValue = sinon.spy((msg, sender, sendResponse) => {
          waitPromises.push(Promise.resolve().then(() => {
            sendResponse("Ignored sendReponse callback on non boolean/thenable return values");
          }));

          // Any return value that is not a promise should not be sent as a response,
          // and any return value that is not true should make the sendResponse
          // calls to be ignored.
          return "Ignored return value";
        });

        const listenerReturnsTrue = sinon.spy((msg, sender, sendResponse) => {
          waitPromises.push(Promise.resolve().then(() => {
            sendResponse("expected sendResponse value");
          }));

          // Expect the asynchronous sendResponse call to be used to send a response
          // when the listener returns true.
          return true;
        });

        const sendResponseSpy = sinon.spy();

        window.browser.runtime.onMessage.addListener(listenerReturnsFalse);
        window.browser.runtime.onMessage.addListener(listenerReturnsValue);
        window.browser.runtime.onMessage.addListener(listenerReturnsTrue);

        equal(fakeChrome.runtime.onMessage.addListener.callCount, 3,
              "runtime.onMessage.addListener should have been called 3 times");

        let wrappedListenerReturnsFalse = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];
        let wrappedListenerReturnsValue = fakeChrome.runtime.onMessage.addListener.secondCall.args[0];
        let wrappedListenerReturnsTrue = fakeChrome.runtime.onMessage.addListener.thirdCall.args[0];

        let returnedValue = wrappedListenerReturnsFalse("test message", {name: "fake sender"}, sendResponseSpy);
        equal(returnedValue, false, "the first wrapped listener should return false");

        returnedValue = wrappedListenerReturnsValue("test message2", {name: "fake sender"}, sendResponseSpy);
        equal(returnedValue, false, "the second wrapped listener should return false");

        returnedValue = wrappedListenerReturnsTrue("test message3", {name: "fake sender"}, sendResponseSpy);
        equal(returnedValue, true, "the third wrapped listener should return true");

        ok(listenerReturnsFalse.calledOnce, "first listener has been called once");
        ok(listenerReturnsValue.calledOnce, "second listener has been called once");
        ok(listenerReturnsTrue.calledOnce, "third listener has been called once");

        // Wait all the collected promises to be resolved and then check the wrapped listener behaviors.
        return Promise.all(waitPromises).then(() => {
          ok(sendResponseSpy.calledOnce, "sendResponse callback should have been called once");

          equal(sendResponseSpy.firstCall.args[0], "expected sendResponse value",
                "sendResponse has been called with the expected value");
        });
      });
    });
  });

  it("ignores a certain chrome.runtime.lastError", () => {
    const fakeChrome = {
      runtime: {
        lastError: {
          message: "The message port closed before a response was received.",
        },
        sendMessage: sinon.stub(),
      },
    };

    return setupTestDOMWindow(fakeChrome).then(window => {
      fakeChrome.runtime.sendMessage
        .onFirstCall().callsArgWith(1, ["res1", "res2"]);

      return window.browser.runtime.sendMessage("some_message").then(
        (...args) => deepEqual(args, [undefined], "The error was ignored")
      );
    });
  });
});
