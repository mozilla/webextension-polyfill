test("Multiple runtime.onmessage listeners which resolve to undefined", async (t) => {
  const res = await browser.runtime.sendMessage("test-multiple-onmessage-listeners:resolve-to-undefined");

  if (navigator.userAgent.includes("Firefox/")) {
    t.deepEqual(res, undefined, "Got an undefined value as expected");
  } else {
    // NOTE: When an onMessage listener sends `undefined` in a response,
    // Chrome internally converts it to null and the receiver receives it
    // as a null object.
    t.deepEqual(res, null, "Got a null value as expected on Chrome");
  }
});

test("Multiple runtime.onmessage listeners which resolve to null", async (t) => {
  const res = await browser.runtime.sendMessage("test-multiple-onmessage-listeners:resolve-to-null");

  t.deepEqual(res, null, "Got a null value as expected");
});
