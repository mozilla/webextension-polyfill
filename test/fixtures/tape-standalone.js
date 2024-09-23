const tape = require("tape-async");

const DEFAULT_TIMEOUT = 500;

let browser = "unknown"; // eslint-disable-line no-redeclare
if (navigator.userAgent.includes("Chrome/")) {
  browser = "Chrome"; // eslint-disable-line no-native-reassign
} else if (navigator.userAgent.includes("Firefox/")) {
  browser = "Firefox"; // eslint-disable-line no-native-reassign
}

// Export as a global a wrapped test function which enforces a timeout by default.
/**
 * @param {string} desc
 *        The test description
 * @param {object} [options]
 *        The test options, can be omitted.
 * @param {number} [options.timeout=DEFAULT_TIMEOUT]
 *        The time after which the test fails automatically, unless it has already passed.
 * @param {boolean} [options.skip]
 *        Whether the test case should be skipped.
 * @param {function(tape.Test):(void|Promise<void>)} fn
 *        The test case function, takes the test object as a callback.
 */
window.test = (desc, options, fn) => {
  if (typeof options === "function") {
    // Allow swapping options with fn
    [fn, options] = [options, fn];
  }

  options = {
    timeout: DEFAULT_TIMEOUT,
    ...options,
  };

  tape(`${desc} (${browser})`, options, async (t) => {
    await fn(t);
  });
};

// Export the rest of the property usually available on the tape test object.
window.test.skip = tape.skip.bind(tape);
window.test.onFinish = tape.onFinish.bind(tape);
window.test.onFailure = tape.onFailure.bind(tape);

// Configure dump test results into an HTML pre element
// added to the test page.
const stream = tape.createStream();
let results = "";
stream.on("data", (result) => {
  // Skip the TAP protocol version from the collected logs.
  if (!result.startsWith("TAP version")) {
    console.log("TAP test result:", result);
    results += result;
  }
});
stream.on("end", () => {
  try {
    const el = document.createElement("pre");
    el.setAttribute("id", "test-results");
    el.textContent = results;
    document.body.appendChild(el);
  } catch (err) {
    console.error(err);
  } finally {
    console.log("TAP tests completed.");
  }
});
