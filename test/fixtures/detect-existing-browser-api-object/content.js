/* global originalAPIObjects */

test("browser api object in content script", (t) => {
  t.ok(browser && browser.runtime, "a global browser API object should be defined");
  t.ok(chrome && chrome.runtime, "a global chrome API object should be defined");

  if (navigator.userAgent.includes("Firefox/")) {
    // Check that the polyfill didn't create a polyfill wrapped browser API object on Firefox.
    t.equal(browser, originalAPIObjects.browser, "browser API object should not be changed on Firefox");
    // On Firefox, window is not the global object for content scripts, and so we expect window.browser to not
    // be defined.
    t.equal(window.browser, undefined, "window.browser is expected to be undefined on Firefox");
  } else {
    // Check that the polyfill has created a wrapped API namespace as expected.
    t.notEqual(browser.runtime, chrome.runtime, "browser.runtime and chrome.runtime should not be equal");
    // On chrome, window is the global object and so the polyfilled browser API should
    // be also equal to window.browser.
    t.equal(browser, window.browser, "browser and window.browser should be the same object");
  }
});

test("browser api object in background page", async (t) => {
  const reply = await browser.runtime.sendMessage("test-api-object-in-background-page");

  t.ok(reply.browserIsDefined, "a global browser API object should be defined");
  t.ok(reply.chromeIsDefined, "a global chrome API object should be defined");

  if (navigator.userAgent.includes("Firefox/")) {
    t.ok(reply.browserIsUnchanged, "browser API object should not be changed on Firefox");
    t.ok(reply.windowBrowserIsUnchanged, "window.browser API object should not be changed on Firefox");
  } else {
    t.ok(!reply.browserIsUnchanged, "browser API object should have been defined by the polyfill");
    t.ok(!reply.windowBrowserIsUnchanged, "window.browser API object should have been defined by the polyfill");
  }
});
