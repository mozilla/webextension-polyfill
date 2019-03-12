const tape = require("tape-async");

const DEFAULT_TIMEOUT = 500;

let browser = "unknown";
if (navigator.userAgent.includes("Chrome/")) {
  browser = "Chrome";
} else if (navigator.userAgent.includes("Firefox/")) {
  browser = "Firefox";
}

// Export as a global a wrapped test function which enforces a timeout by default.
// eslint-disable-next-line
/**
 * @param {string} desc
 * @param {import("tape").TestOptions|null} [options]
 * @param {(test: import("tape").Test) => void|Promise<void>} fn
 */
window.test = (desc, options, fn) => {
  if (typeof options === "function") {
    // Allow swapping options with fn
    if (typeof fn === "object" && fn) {
      let tmp = fn;
      fn = options;
      options = tmp;
    } else {
      fn = options;
      options = undefined;
    }
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
