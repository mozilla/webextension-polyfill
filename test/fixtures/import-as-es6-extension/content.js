test("Test browser.runtime.onMessage on polyfill loaded as es6 module", async (t) => {
  const msg = "send-message-to-background-page";
  const res = await browser.runtime.sendMessage(msg);
  t.deepEqual(res, {bgReceived: msg}, "Got the expected reply");
});
