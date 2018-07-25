browser.runtime.onMessage.addListener(async (msg) => {
  let {method, args} = msg;
  let result = await browser.privacy.services.passwordSavingEnabled[method](...args);
  return {result, type: typeof result};
});
