"use strict";

const path = require("path");

const waitUntil = require("async-wait-until");
const {deepEqual} = require("chai").assert;
const puppeteer = require("puppeteer");

const {createHTTPServer} = require("./setup");

const fixtureExtensionDirName = "runtime-messaging-extension";

const extensionName = require(`../fixtures/${fixtureExtensionDirName}/manifest.json`).name;

describe("browser.runtime.onMessage/sendMessage", function() {
  this.timeout(10000);

  it("works as expected on Chrome", async () => {
    const server = await createHTTPServer(path.join(__dirname, "..", "fixtures"));

    const url = `http://localhost:${server.address().port}`;

    const browser = await puppeteer.launch({
      // Chrome Extensions are not currently supported in headless mode.
      headless: false,

      // Custom chrome arguments.
      args: [
        `--load-extension=${process.env.TEST_EXTENSIONS_PATH}/${fixtureExtensionDirName}`,
      ],
    });

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

    // Wait until the last expected message has been received.
    const res = await waitUntil(() => {
      return pageConsoleMessages.filter((msg) => {
        return msg[0] === lastExpectedMessage[0] && msg[1] === lastExpectedMessage[1];
      }).length > 0;
    }, 5000).catch(error => error);

    deepEqual(pageConsoleMessages, expectedConsoleMessages, "Got the expected console messages");

    await browser.close();

    server.close();

    if (res instanceof Error) {
      // Re-throw the unexpected error, if the test didn't fail yet.
      throw res;
    }
  });
});
