test("privacy API should be unavailable in the content script", (t) => {
  t.deepEqual(browser.privacy, undefined, "browser.privacy should not be available in a content script");
});

test("privacy API should support promises", async (t) => {
  async function callSettingAPI(method, ...args) {
    // Invokes: browser.privacy.services.passwordSavingEnabled[method](...args);
    let {type, result} = await browser.runtime.sendMessage({method, args});
    // In Chrome `undefined` values are serialized to `null`, so check the type
    // as determined in the background page.
    return type === "undefined" ? undefined : result;
  }

  let res = await callSettingAPI("get", {});
  t.deepEqual(res, {
    levelOfControl: "controllable_by_this_extension",
    // Enabled by default in Chrome; disabled by default in Firefox.
    value: !navigator.userAgent.includes("Firefox/"),
  }, "passwordSavingEnabled.get() resolves to the initial value");

  const defaultValue = res.value;
  const newValue = !defaultValue;
  res = await callSettingAPI("set", {value: newValue});
  if (navigator.userAgent.includes("Firefox/")) {
    t.equal(res, true, "passwordSavingEnabled.set() resolves to true");
  } else {
    t.equal(res, undefined, "passwordSavingEnabled.set() resolves to a void value");
  }

  res = await callSettingAPI("get", {});
  t.deepEqual(res, {
    levelOfControl: "controlled_by_this_extension",
    value: newValue,
  }, "passwordSavingEnabled.get() resolves to the updated value");

  res = await callSettingAPI("clear", {});
  if (navigator.userAgent.includes("Firefox/")) {
    t.equal(res, true, "passwordSavingEnabled.clear() resolves to true");
  } else {
    t.equal(res, undefined, "passwordSavingEnabled.clear() resolves to a void value");
  }

  res = await callSettingAPI("get", {});
  t.deepEqual(res, {
    levelOfControl: "controllable_by_this_extension",
    value: defaultValue,
  }, "passwordSavingEnabled.get() resolves to the default value");
});
