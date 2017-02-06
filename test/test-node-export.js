"use strict";

const {deepEqual, strictEqual, notStrictEqual, throws} = require("chai").assert;
const {testCustomProperties, testUndefinedProperties} = require("./helpers");

describe("node-export", () => {
  beforeEach(() => {
    delete global.browser;
    delete global.chrome;
    delete require.cache[require.resolve("../")];
  });

  it("exports the global browser namespace if it already exists", () => {
    global.browser = {key: "value"};

    const exported = require("../");

    strictEqual(exported, browser);
  });

  it("exports a wrapper around the global chrome namespace", () => {
    global.chrome = {key: "value"};

    const exported = require("../");

    deepEqual(exported, chrome);
    notStrictEqual(exported, chrome);
  });

  it("throws an error if the global chrome namespace is missing", () => {
    throws(() => require("../"), ReferenceError, /chrome is not defined/);
  });

  describe("browser wrapper", () => {
    it("supports custom properties defined using Object.defineProperty", () => {
      global.chrome = {};
      global.browser = require("../");
      testCustomProperties(global);
    });

    it("returns undefined for property undefined in the target", () => {
      global.chrome = {myns: {mykey: true}};
      global.browser = require("../");
      testUndefinedProperties(global);
    });
  });
});
