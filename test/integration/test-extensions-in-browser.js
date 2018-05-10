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
  description: "polyfill should detect an existent browser API object in content scripts",
  extensions: ["detect-browser-api-object-in-content-script"],
});
