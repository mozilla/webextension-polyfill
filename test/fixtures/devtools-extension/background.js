let onDevToolsPageLoaded = new Promise(resolve => {
  const listener = () => {
    browser.runtime.onConnect.removeListener(listener);
    resolve();
  };
  browser.runtime.onConnect.addListener(listener);
});

browser.runtime.onMessage.addListener(async msg => {
  await onDevToolsPageLoaded;
  return browser.runtime.sendMessage(msg);
});
