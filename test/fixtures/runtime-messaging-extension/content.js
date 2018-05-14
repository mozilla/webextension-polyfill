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
