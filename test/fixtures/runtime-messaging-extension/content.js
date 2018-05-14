const {name} = browser.runtime.getManifest();

async function runTest() {
  let reply;
  reply = await browser.runtime.sendMessage("test - sendMessage with returned Promise reply");
  console.log(name, "test - returned resolved Promise - received", reply);

  reply = await browser.runtime.sendMessage("test - sendMessage with returned value reply");
  console.log(name, "test - returned value - received", reply);

  reply = await browser.runtime.sendMessage("test - sendMessage with synchronous sendResponse");
  console.log(name, "test - synchronous sendResponse - received", reply);

  reply = await browser.runtime.sendMessage("test - sendMessage with asynchronous sendResponse");
  console.log(name, "test - asynchronous sendResponse - received", reply);

  reply = await browser.runtime.sendMessage("test - second listener if the first does not reply");
  console.log(name, "test - second listener sendResponse - received", reply);

  console.log(name, "content script messages sent");
}

console.log(name, "content script loaded");

runTest().catch((err) => {
  console.error("content script error", err);
});

test("sendMessage with returned rejected Promise with Error value", async (t) => {
  try {
    const reply = await browser.runtime.sendMessage(
      "test - sendMessage with returned rejected Promise with Error value");
    t.fail(`Unexpected successfully reply while expecting a rejected promise`);
    t.equal(reply, undefined, "Unexpected successfully reply");
  } catch (err) {
    t.equal(err.message, "rejected-error-value", "Got an error rejection with the expected message");
  }
});

test("sendMessage with returned rejected Promise with non-Error value", async (t) => {
  try {
    const reply = await browser.runtime.sendMessage(
      "test - sendMessage with returned rejected Promise with non-Error value");
    t.fail(`Unexpected successfully reply while expecting a rejected promise`);
    t.equal(reply, undefined, "Unexpected successfully reply");
  } catch (err) {
    // Unfortunately Firefox currently reject an error with an undefined
    // message, in the meantime we just check that the object rejected is
    // an instance of Error.
    t.ok(err instanceof Error, "Got an error object as expected");
  }
});
