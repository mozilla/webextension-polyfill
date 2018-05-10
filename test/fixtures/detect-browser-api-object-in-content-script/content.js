test("browser api object in content script", (t) => {
  t.ok(browser && browser.runtime, "a global browser API object should be defined");
  t.ok(chrome && chrome.runtime, "a global chrome API object should be defined");

  if (navigator.userAgent.includes("Firefox/")) {
    // Check that the polyfill didn't create a polyfill wrapped browser API object on Firefox.
    t.equal(browser.runtime, chrome.runtime, "browser.runtime and chrome.runtime should be equal on Firefox");
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
