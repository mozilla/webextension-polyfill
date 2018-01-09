"use strict";

const path = require("path");

const waitUntil = require("async-wait-until");
const {deepEqual} = require("chai").assert;

const {createHTTPServer, launchPuppeteer} = require("./setup");

const fixtureExtensionDirName = "runtime-messaging-extension";

const extensionName = require(`../fixtures/${fixtureExtensionDirName}/manifest.json`).name;

describe("browser.runtime.onMessage/sendMessage", function() {
  this.timeout(10000);

  it("works as expected on Chrome", async () => {
    const server = await createHTTPServer(path.join(__dirname, "..", "fixtures"));

    const url = `http://localhost:${server.address().port}`;

    const browser = await launchPuppeteer([
      `--load-extension=${process.env.TEST_EXTENSIONS_PATH}/${fixtureExtensionDirName}`,
    ]);

    const page = await browser.newPage();

    const pageConsoleMessages = [];
    const pageErrors = [];

    page.on("console", (...args) => {
      pageConsoleMessages.push(args);
    });

    page.on("error", (error) => {
      pageErrors.push(error);
    });

    await page.goto(url);

    const expectedConsoleMessages = [
      [extensionName, "content script loaded"],
      [extensionName, "content script message sent"],
      [extensionName, "content script received reply", {"reply": "background page reply"}],
    ];

    const lastExpectedMessage = expectedConsoleMessages.slice(-1).pop();

    let unexpectedException;

    try {
      // Wait until the last expected message has been received.
      await waitUntil(() => {
        return pageConsoleMessages.filter((msg) => {
          return msg[0] === lastExpectedMessage[0] && msg[1] === lastExpectedMessage[1];
        }).length > 0;
      }, 5000);
    } catch (error) {
      // Collect any unexpected exception (e.g. a timeout error raised by waitUntil),
      // it will be part of the deepEqual assertion of the results.
      unexpectedException = error;
    }

    let actualResults = {
      consoleMessages: pageConsoleMessages,
      unexpectedException,
    };

    let expectedResults = {
      consoleMessages: expectedConsoleMessages,
      unexpectedException: undefined,
    };

    try {
      deepEqual(actualResults, expectedResults, "Got the expected results");
    } finally {
      // ensure that we close the browser and the test HTTP server before exiting
      // the test, even when the assertions fails.
      await Promise.all([
        browser.close(),
        new Promise(resolve => server.close(resolve)),
      ]);
    }
  });
});
