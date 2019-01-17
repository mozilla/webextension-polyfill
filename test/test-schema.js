"use strict";

const {assert} = require("chai");
const Ajv = require("ajv");
const betterAjvErrors = require("better-ajv-errors");

const ajv = new Ajv({jsonPointers: true, allErrors: true});

const schema = require("../api-metadata.schema.json");
const data = require("../api-metadata.json");

describe("api-metadata.json", () => {
  it("api-metadata.json matches schema", () => {
    const valid = ajv.validate(schema, data);
    if (!valid) {
      assert.fail(undefined, undefined, betterAjvErrors(schema, data, ajv.errors, {indent: 2}));
    }
  });
});
