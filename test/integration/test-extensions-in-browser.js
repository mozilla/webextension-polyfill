"use strict";

const {defineExtensionTests} = require("./setup");

defineExtensionTests({
  description: "browser.runtime.onMessage/sendMessage",
  extensions: ["runtime-messaging-extension"],
});

defineExtensionTests({
  description: "browser.runtime.onMessage/sendMessage",
  extensions: ["tabs-sendmessage-extension"],
});

defineExtensionTests({
  description: "browser.runtime.onMessage/sendMessage",
  extensions: ["multiple-onmessage-listeners-extension"],
});

defineExtensionTests({
  description: "polyfill should detect an existing browser API object in content scripts and extension pages",
  extensions: ["detect-existing-browser-api-object"],
});

defineExtensionTests({
  description: "Instance of BrowserSetting API",
  extensions: ["privacy-setting-extension"],
});
