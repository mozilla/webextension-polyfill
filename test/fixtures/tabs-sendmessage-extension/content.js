test("tabs.sendMessage reject when sending to unknown tab id", async (t) => {
  const res = await browser.runtime.sendMessage("test-tabssendMessage-unknown-tabid");
  const errorMessage = navigator.userAgent.includes("Edge/") ?
    "Invalid argument." : "Could not establish connection. Receiving end does not exist.";
  t.deepEqual(res, {
    success: true,
    isRejected: true,
    errorMessage,
  }, "The background page got a rejection as expected");
});
