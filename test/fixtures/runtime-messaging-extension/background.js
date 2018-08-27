const {name} = browser.runtime.getManifest();

console.log(name, "background page loaded");

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(name, "background received msg", {msg, sender});

  switch (msg) {
    case "test - sendMessage with returned Promise reply":
      try {
        browser.pageAction.show(sender.tab.id);
      } catch (err) {
        return Promise.resolve(`Unexpected error on pageAction.show: ${err}`);
      }

      return Promise.resolve("bg page reply 1");

    case "test - sendMessage with returned value reply":
      // This is supposed to be ignored and the sender should receive
      // a reply from the second listener.
      return "Unexpected behavior: a plain return value should not be sent as a result";

    case "test - sendMessage with synchronous sendResponse":
      sendResponse("bg page reply 3");
      return "value returned after calling sendResponse synchrously";

    case "test - sendMessage with asynchronous sendResponse":
      setTimeout(() => sendResponse("bg page reply 4"), 50);
      return true;

    case "test - second listener if the first does not reply":
      // This is supposed to be ignored and the sender should receive
      // a reply from the second listener.
      return false;

    case "test - sendMessage with returned rejected Promise with Error value":
      return Promise.reject(new Error("rejected-error-value"));

    case "test - sendMessage with returned rejected Promise with non-Error value":
      return Promise.reject("rejected-non-error-value");

    case "test - sendMessage with returned rejected Promise with non-Error value with message property":
      return Promise.reject({message: "rejected-non-error-message"});

    case "test - sendMessage with listener callback throws":
      throw new Error("listener throws");

    case "test - sendMessage and no listener answers":
      return undefined;

    default:
      return Promise.resolve(
        `Unxpected message received by the background page: ${JSON.stringify(msg)}\n`);
  }
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === "test - sendMessage and no listener answers") {
    return undefined;
  }

  setTimeout(() => {
    sendResponse("second listener reply");
  }, 100);

  return true;
});

console.log(name, "background page ready to receive a content script message...");
