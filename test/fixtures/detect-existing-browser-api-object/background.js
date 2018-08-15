/* global originalAPIObjects */

browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg !== "test-api-object-in-background-page") {
    throw new Error(`Unexpected message received: ${msg}`);
  }

  return {
    browserIsDefined: !!browser,
    chromeIsDefined: !!chrome,
    browserIsUnchanged: browser === originalAPIObjects.browser,
    windowBrowserIsUnchanged: window.browser === originalAPIObjects.browser,
  };
});
