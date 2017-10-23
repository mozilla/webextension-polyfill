const {name} = browser.runtime.getManifest();

console.log(name, "background page loaded");

browser.runtime.onMessage.addListener((msg, sender) => {
  console.log(name, "background received msg", {msg, sender});

  return Promise.resolve("background page reply");
});

console.log(name, "background page ready to receive a content script message...");
