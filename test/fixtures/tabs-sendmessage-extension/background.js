console.log(name, "background page loaded");

browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  console.log(name, "background received msg", {msg, sender});

  // We only expect messages coming from a content script in this test.
  if (!sender.tab || msg != "test-tabssendMessage-unknown-tabid") {
    return {
      success: false,
      failureReason: `An unexpected message has been received: ${JSON.stringify({msg, sender})}`,
    };
  }

  try {
    const tabs = await browser.tabs.query({});
    const lastValidTabId = tabs.reduce((acc, tab) => {
      return Math.max(acc, tab.id);
    }, 0);
    const INVALID_TABID = lastValidTabId + 100;

    await browser.tabs.sendMessage(INVALID_TABID, "message-to-unknown-tab");

    return {
      success: false,
      failureReason: `browser.tabs.sendMessage should reject on sending messages to non-existing tab`,
    };
  } catch (err) {
    return {
      success: true,
      isRejected: true,
      errorMessage: err.message,
    };
  }
});

console.log(name, "background page ready to receive a content script message...");
