"use strict";

const {assert} = require("chai");
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped runtime.onMessage listener", () => {
    it("keep track of the listeners added", () => {
      const messageListener = sinon.spy();

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
        fakeChrome.runtime.onMessage.hasListener
          .onFirstCall().returns(false)
          .onSecondCall().returns(true);

        assert.equal(window.browser.runtime.onMessage.hasListener(messageListener),
                     false, "Got hasListener==false before the listener has been added");
        window.browser.runtime.onMessage.addListener(messageListener);
        assert.equal(window.browser.runtime.onMessage.hasListener(messageListener),
                     true, "Got hasListener=true once the listener has been added");
        window.browser.runtime.onMessage.addListener(messageListener);

        assert.ok(fakeChrome.runtime.onMessage.addListener.calledTwice,
                  "addListener has been called twice");
        assert.equal(fakeChrome.runtime.onMessage.addListener.secondCall.args[0],
                     fakeChrome.runtime.onMessage.addListener.firstCall.args[0],
                     "both the addListener calls received the same wrapped listener");

        const wrappedListener = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];
        wrappedListener("msg", {name: "sender"}, function sendResponse() {});
        assert.ok(messageListener.calledOnce, "The listener has been called once");

        window.browser.runtime.onMessage.removeListener(messageListener);
        assert.ok(fakeChrome.runtime.onMessage.removeListener.calledOnce,
                  "removeListener has been called once");
        assert.equal(fakeChrome.runtime.onMessage.addListener.secondCall.args[0],
                     fakeChrome.runtime.onMessage.removeListener.firstCall.args[0],
                     "both the addListener and removeListenercalls received the same wrapped listener");
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

      const messageListener = sinon.stub();
      const firstResponse = "fake reply";
      const secondResponse = Promise.resolve("fake reply2");
      const sendResponseSpy = sinon.spy();

      messageListener.onFirstCall().returns(firstResponse)
        .onSecondCall().returns(secondResponse);

      return setupTestDOMWindow(fakeChrome).then(window => {
        window.browser.runtime.onMessage.addListener(messageListener);

        assert.ok(fakeChrome.runtime.onMessage.addListener.calledOnce);

        const wrappedListener = fakeChrome.runtime.onMessage.addListener.firstCall.args[0];

        wrappedListener("fake message", {name: "fake sender"}, sendResponseSpy);

        assert.ok(messageListener.calledOnce, "The unwrapped message listener has been called");
        assert.deepEqual(messageListener.firstCall.args,
                         ["fake message", {name: "fake sender"}],
                         "The unwrapped message listener has received the expected parameters");

        assert.ok(sendResponseSpy.calledOnce, "The sendResponse function has been called");
        assert.equal(sendResponseSpy.firstCall.args[0], "fake reply",
                     "sendResponse callback has been called with the expected parameters");

        wrappedListener("fake message2", {name: "fake sender2"}, sendResponseSpy);

        // Wait the second response promise to be resolved.
        return secondResponse;
      }).then(() => {
        assert.ok(messageListener.calledTwice,
                  "The unwrapped message listener has been called");
        assert.deepEqual(messageListener.secondCall.args,
                         ["fake message2", {name: "fake sender2"}],
                         "The unwrapped message listener has received the expected parameters");

        assert.ok(sendResponseSpy.calledTwice, "The sendResponse function has been called");
        assert.equal(sendResponseSpy.secondCall.args[0], "fake reply2",
                     "sendResponse callback has been called with the expected parameters");
      });
    });
  });
});
