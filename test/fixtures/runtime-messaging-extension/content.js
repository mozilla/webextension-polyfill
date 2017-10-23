const {name} = browser.runtime.getManifest();

console.log(name, "content script loaded");

browser.runtime.sendMessage("content script message").then(reply => {
  console.log(name, "content script received reply", {reply});
});

console.log(name, "content script message sent");
