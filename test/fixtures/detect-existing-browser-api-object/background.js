/* global originalAPIObjects */

// Register an additional message handler that always reply after
// a small latency time.
browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg !== "test-api-object-in-background-page") {
    return false;
  }

  return Promise.resolve({
    browserIsDefined: !!browser,
    chromeIsDefined: !!chrome,
    browserIsUnchanged: browser === originalAPIObjects.browser,
  });
});
