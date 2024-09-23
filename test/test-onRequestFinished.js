"use strict";

const {deepEqual, equal, ok} = assert;
const sinon = require("sinon");

const {setupTestDOMWindow} = require("./setup");

describe("browser-polyfill", () => {
  describe("wrapped devtools.network.onRequestFinished listener", () => {
    it("does not wrap the listener if it is not a function", () => {
      const fakeChrome = {
        devtools: {
          network: {
            onRequestFinished: {
              addListener: sinon.spy(),
            },
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const fakeNonFunctionListener = {fake: "non function listener"};

        const browserOnRequestFinished = window.browser.devtools.network.onRequestFinished;
        browserOnRequestFinished.addListener(fakeNonFunctionListener);

        const fakeChromeOnRequestFinished = fakeChrome.devtools.network.onRequestFinished;
        deepEqual(
          fakeChromeOnRequestFinished.addListener.firstCall.args[0],
          fakeNonFunctionListener,
          "The non-function listener has not been wrapped"
        );
      });
    });

    it("promisifies the result", () => {
      const fakeChrome = {
        devtools: {
          network: {
            onRequestFinished: {
              addListener: sinon.spy(),
              hasListener: sinon.stub(),
              removeListener: sinon.spy(),
            },
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const listener = sinon.spy();

        const browserOnRequestFinished = window.browser.devtools.network.onRequestFinished;
        browserOnRequestFinished.addListener(listener);

        const fakeChromeOnRequestFinished = fakeChrome.devtools.network.onRequestFinished;
        ok(fakeChromeOnRequestFinished.addListener.calledOnce,
           "devtools.network.onRequestFinished.addListener has been called once");

        const wrappedListener = fakeChromeOnRequestFinished.addListener.firstCall.args[0];
        wrappedListener({
          getContent(cb) {
            cb("<html>...</html>", "text/html; charset=utf8");
          },
        });

        ok(listener.calledOnce, "listener has been called once");

        const req = listener.firstCall.args[0];
        return req.getContent().then(([content, encodingOrMimeType]) => {
          equal(content, "<html>...</html>");
          // On Chrome this is the encoding ('' or 'base64') while on Firefox
          // this is the MIME type of the resource.
          // See: https://github.com/mozilla/webextension-polyfill/issues/249#issuecomment-740000461
          equal(encodingOrMimeType, "text/html; charset=utf8");
        });
      });
    });

    it("promisifies the result with a wrapped Request object", () => {
      const fakeChrome = {
        devtools: {
          network: {
            onRequestFinished: {
              addListener: sinon.spy(),
              hasListener: sinon.stub(),
              removeListener: sinon.spy(),
            },
          },
        },
      };

      return setupTestDOMWindow(fakeChrome).then(window => {
        const listener = sinon.spy();

        const browserOnRequestFinished = window.browser.devtools.network.onRequestFinished;
        browserOnRequestFinished.addListener(listener);

        const fakeChromeOnRequestFinished = fakeChrome.devtools.network.onRequestFinished;
        ok(fakeChromeOnRequestFinished.addListener.calledOnce,
           "devtools.network.onRequestFinished.addListener has been called once");

        const request = Object.create({
          inheritedProp: true,
          getContent(cb) {
            cb("", "");
          },
        });

        const wrappedListener = fakeChromeOnRequestFinished.addListener.firstCall.args[0];
        wrappedListener(request);

        ok(listener.calledOnce, "listener has been called once");

        const req = listener.firstCall.args[0];
        ok(req.inheritedProp, "Wrapped request inherited prototype properties");
      });
    });
  });
});
