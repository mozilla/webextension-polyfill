"use strict";

const {assert} = require("chai");
const Ajv = require("ajv");
const betterAjvErrors = (() => {
  // Wrapper to work around https://github.com/atlassian/better-ajv-errors/pull/21
  const _betterAjvErrors = require("better-ajv-errors");
  function betterAjvErrors(schema, data, errors, options) {
    return errors
      .map(e => _betterAjvErrors(schema, data, [e], options))
      .join("\n\n");
  }

  Object.setPrototypeOf(betterAjvErrors, _betterAjvErrors);

  return /** @type {typeof _betterAjvErrors} */ (betterAjvErrors);
})();

const ajv = new Ajv({jsonPointers: true, allErrors: true});

const schema = require("../api-metadata.schema.json");
const data = require("../api-metadata.json");

describe("api-metadata.json", () => {
  it("api-metadata.json matches schema", () => {
    const valid = ajv.validate(schema, data);
    if (!valid) {
      assert.fail(
        undefined,
        undefined,
        `API Metadata doesn't match schema:

${betterAjvErrors(schema, data, ajv.errors, {indent: 2})}`,
      );
    }
  });
});
