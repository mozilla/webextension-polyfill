browser.runtime.onMessage.addListener(async (msg, sender) => {
  return {bgReceived: msg};
});
