"use strict";

const {deepEqual, equal, ok} = require("chai").assert;

module.exports.testCustomProperties = window => {
  Object.defineProperty(window.browser, "myns", {
    enumerable: true,
    configurable: true,
    value: {mykey: true},
  });

  ok("myns" in window.browser, "The custom property exists");
  ok("mykey" in window.browser.myns,
     "The content of the custom property exists");

  deepEqual(window.browser.myns, {mykey: true},
            "The custom property has the expected content");

  delete window.browser.myns;

  ok(!("myns" in window.browser),
     "The deleted custom defined property has been removed");
};

module.exports.testUndefinedProperties = window => {
  equal(window.browser.myns.mykey, true,
        "Got the expected result from a wrapped property");
  equal(window.browser.myns.nonexistent, undefined,
        "Got undefined for non existent property");
  equal(window.browser.nonexistent, undefined,
        "Got undefined for non existent namespaces");
};
