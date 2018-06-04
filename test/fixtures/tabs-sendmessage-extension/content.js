test("tabs.sendMessage reject when sending to unknown tab id", async (t) => {
  const res = await browser.runtime.sendMessage("test-tabssendMessage-unknown-tabid");
  t.deepEqual(res, {
    success: true,
    isRejected: true,
    errorMessage: "Could not establish connection. Receiving end does not exist.",
  }, "The background page got a rejection as expected");
});
