const {name} = browser.runtime.getManifest();

console.log(name, "background page loaded");

browser.runtime.onMessage.addListener((msg, sender) => {
  console.log(name, "background received msg", {msg, sender});

  try {
    browser.pageAction.show(sender.tab.id);
  } catch (err) {
    return Promise.resolve(`Unexpected error on pageAction.show: ${err}`);
  }

  return Promise.resolve("background page reply");
});

console.log(name, "background page ready to receive a content script message...");
