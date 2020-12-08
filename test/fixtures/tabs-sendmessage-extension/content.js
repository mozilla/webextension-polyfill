test("tabs.sendMessage reject when sending to unknown tab id", async (t) => {
  const res = await browser.runtime.sendMessage("test-tabssendMessage-unknown-tabid");
  let errorMessage = "Could not establish connection. Receiving end does not exist.";
  const firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || ["", "0"])[1];
  if (firefoxVersion === 79) {
    // Value of error message regressed in:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1583484
    // and got fixed in Firefox 83 in:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1665568
    errorMessage = "Error: tab is null";
  } else if (firefoxVersion >= 80 && firefoxVersion < 83) {
    // Raw error message leaked until it got sanitized again with
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1655624
    errorMessage = "An unexpected error occurred";
  }
  t.deepEqual(res, {
    success: true,
    isRejected: true,
    errorMessage,
  }, "The background page got a rejection as expected");
});
