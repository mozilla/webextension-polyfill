const finalhandler = require("finalhandler");
const http = require("http");
const serveStatic = require("serve-static");
const puppeteer = require("puppeteer");

exports.createHTTPServer = async (path) => {
  var serve = serveStatic(path);

  var server = http.createServer((req, res) => {
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

exports.launchPuppeteer = async (puppeteerArgs) => {
  if (!puppeteerArgs || !Array.isArray(puppeteerArgs)) {
    throw new Error(`Invalid puppeteer arguments: ${JSON.stringify(puppeteerArgs)}`);
  }

  const args = [].concat(puppeteerArgs);

  // Pass the --no-sandbox chrome CLI option when running the integration tests
  // on Travis.
  if (process.env.TRAVIS_CI) {
    args.push("--no-sandbox");
  }

  return puppeteer.launch({
    // Chrome Extensions are not currently supported in headless mode.
    headless: false,

    // Custom chrome arguments.
    args,
  });
};
