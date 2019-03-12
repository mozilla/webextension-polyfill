"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const browserify = require("browserify");
const finalhandler = require("finalhandler");
const serveStatic = require("serve-static");
const {Builder, By, until} = require("selenium-webdriver");

const test = require("tape-async");
const tmp = require("tmp");
const {cp} = require("shelljs");

const TEST_TIMEOUT = 5000;

const launchBrowser = async (launchOptions) => {
  const browser = launchOptions.browser;
  const extensionPath = launchOptions.extensionPath;
  const openDevTools = launchOptions.openDevTools;

  let driver;

  if (browser === "chrome") {
    const chrome = require("selenium-webdriver/chrome");
    const chromedriver = require("chromedriver");

    if (process.env.HEADLESS === "1") {
      console.warn("WARN: Chrome doesn't currently support extensions in headless mode. " +
                   "Falling back to non-headless mode");
    }

    const options = new chrome.Options();
    options.addArguments([
      `--load-extension=${extensionPath}`,
      // See https://docs.travis-ci.com/user/chrome and issue #85 for a rationale.
      "--no-sandbox",
    ]);

    if (openDevTools) {
      options.addArguments(["-auto-open-devtools-for-tabs"]);
    }

    if (process.env.TEST_NATIVE_CRX_BINDINGS === "1") {
      console.warn("NOTE: Running tests on a Chrome instance with NativeCrxBindings enabled.");
      options.addArguments([
        "--enable-features=NativeCrxBindings",
      ]);
    }

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
      .build();
  } else if (browser === "firefox") {
    const firefox = require("selenium-webdriver/firefox");
    const geckodriver = require("geckodriver");
    const {Command} = require("selenium-webdriver/lib/command");

    const options = new firefox.Options();

    if (process.env.HEADLESS === "1") {
      options.headless();
    }

    if (openDevTools) {
      options.addArguments("-devtools");
    }

    driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(geckodriver.path))
      .build();

    const command = new Command("install addon")
      .setParameter("path", extensionPath)
      .setParameter("temporary", true);

    await driver.execute(command);
  } else {
    const errorHelpMsg = (
      "Set a supported browser (firefox or chrome) " +
      "using the TEST_BROWSER_TYPE environment var.");
    throw new Error(`Target browser not supported yet: ${browser}. ${errorHelpMsg}`);
  }

  return driver;
};

const createHTTPServer = async (path) => {
  const serve = serveStatic(path);
  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });

  return new Promise((resolve, reject) => {
    server.listen((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(server);
      }
    });
  });
};

async function runExtensionTest(t, server, driver, extensionDirName, browser) {
  try {
    const url = `http://localhost:${server.address().port}`;
    const userAgent = await driver.executeScript(() => window.navigator.userAgent);

    t.pass(`Connected to ${browser} browser: ${userAgent}"`);

    await driver.get(url);

    // Merge tap results from the connected browser.
    const el = await driver.wait(until.elementLocated(By.id("test-results")), 10000);
    const testResults = await el.getAttribute("textContent");
    console.log(testResults);
  } catch (err) {
    t.fail(err);
  }
}

const awaitStreamEnd = (stream) => {
  return new Promise((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
};

const bundleTapeStandalone = async (destDir) => {
  const bundleFileName = path.join(destDir, "tape.js");
  const b = browserify();
  b.add(path.join(__dirname, "..", "fixtures", "tape-standalone.js"));

  // Inject setImmediate (used internally by tape).
  b.transform("global-replaceify", {
    global: true,
    replacements: {
      setImmediate: "require('timers').setImmediate",
    },
  });

  const stream = b.bundle();
  const onceStreamEnd = awaitStreamEnd(stream);
  const destFileStream = fs.createWriteStream(bundleFileName);
  const onceWritten = new Promise(resolve => {
    destFileStream.on("close", resolve);
  });
  stream.pipe(destFileStream);

  await Promise.all([onceStreamEnd, onceWritten]);
};

test.onFailure(() => {
  process.exit(1);
});

/**
 * @param {object} parameters
 * @param {string} parameters.description
 * @param {string[]} parameters.extensions
 * @param {boolean|string|string[]} [parameters.skip]
 * @param {boolean} [parameters.openDevTools]
 */
const defineExtensionTests = ({description, extensions, skip, openDevTools}) => {
  for (const extensionDirName of extensions) {
    test(`${description} (test extension: ${extensionDirName})`, async (tt) => {
      let timeout;
      let driver;
      let server;
      let tempDir;

      const browser = process.env.TEST_BROWSER_TYPE;

      if (skip) {
        if (skip === true) {
          tt.skip("Test extension skipped");
          return;
        } else if (skip instanceof Array ? skip.includes(browser) : skip === browser) {
          tt.skip("Test extension skipped on: " + browser);
          return;
        }
        console.log(`Skip condition ignored: '${skip}' != '${browser}'`);
      }

      try {
        const srcExtensionPath = path.resolve(
          path.join(__dirname, "..", "fixtures", extensionDirName));
        const srcPolyfill = path.join(__dirname, "..", "..", "dist", "browser-polyfill.js");

        tempDir = tmp.dirSync({unsafeCleanup: true});
        const extensionPath = path.join(tempDir.name, extensionDirName);

        cp("-rf", srcExtensionPath, extensionPath);
        cp("-f", srcPolyfill, extensionPath);
        cp("-f", `${srcPolyfill}.map`, extensionPath);
        await bundleTapeStandalone(extensionPath);

        server = await createHTTPServer(path.join(__dirname, "..", "fixtures"));
        driver = await launchBrowser({extensionPath, browser, openDevTools});
        await Promise.race([
          runExtensionTest(tt, server, driver, extensionDirName, browser),
          new Promise((resolve, reject) => {
            timeout = setTimeout(() => reject(new Error(`test timeout after ${TEST_TIMEOUT}`)), TEST_TIMEOUT);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
        if (driver) {
          await driver.quit();
          driver = null;
        }
        if (server) {
          server.close();
          server = null;
        }
        if (tempDir) {
          tempDir.removeCallback();
        }
      }
    });
  }
};

module.exports = {
  launchBrowser,
  createHTTPServer,
  defineExtensionTests,
};
