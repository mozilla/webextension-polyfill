#!/usr/bin/env node
/* eslint indent: 0, object-curly-spacing: 0 */

const path = require("path");
const { promisify } = require("util");
const fs = require("fs");

const lcovParse = promisify(require("lcov-parse"));
const lcovWrite = promisify(require("lcov-write").write);
const { SourceMapConsumer } = require("source-map");

const ROOT_DIR = path.join(__dirname, "..");
const LCOV_REPORT = path.join(ROOT_DIR, "coverage", "lcov.info");
const SOURCE_MAP = path.join(ROOT_DIR, "dist", "browser-polyfill.js.map");

const makeFixDetails =
  (consumer) =>
  ({ details, ...rest }) => {
    return {
      ...rest,
      details: details.map((entry) => {
        const { line } = consumer.originalPositionFor({
          line: entry.line,
          column: 0,
        });

        return {
          ...entry,
          line,
        };
      }),
    };
  };

(async function main() {
  const rawLcovData = await lcovParse(LCOV_REPORT);
  const rawSourceMap = await fs.promises.readFile(SOURCE_MAP);

  await SourceMapConsumer.with(
    JSON.parse(rawSourceMap),
    null,
    async (consumer) => {
      const fixDetails = makeFixDetails(consumer);

      const newData = rawLcovData.map((data) => {
        const { file, lines, functions, branches } = data;

        return {
          ...data,
          file: file.replace("dist/", "src/"),
          lines: fixDetails(lines),
          functions: fixDetails(functions),
          branches: fixDetails(branches),
        };
      });

      // Overwrite previous report.
      await lcovWrite(newData, LCOV_REPORT);
    }
  );
})();
