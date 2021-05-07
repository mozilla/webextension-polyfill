"use strict";
/**
 * This file walks the extension API namespace and
 * infers the expected API format from the error messages.
 * See schemaErrorToSignature for the signature mapping logic.
 * Call generateApiMetadata() to see the generated signatures.
 *
 * collectAndSend() will be called and kick off the signature collection.
 */

// A list of arguments that is never valid.
const INVALID_ARGUMENT_LIST = new Array(9).fill(Symbol.for("INVALID_ARGUMENT_SYMBOL"));

function ignorePath(fullpath, rootpath, key) {
  if (rootpath === "") {
    return key === "app" ||
      key === "csi" ||
      key === "loadTimes" ||
      key === "Event";
  }
  return (
    // Events are handled separately.
    key.startsWith("on") ||
    // Constructors never take callbacks.
    /^[A-Z]/.test(key) ||
    // The only API that takes a callback and also returns a non-void value.
    fullpath === "contextMenus.create" ||
    // ContentSettings and BrowserSettings objects do not provide the method
    // signatures when an error is thrown.
    /^contentSettings\.[^.]+$/.test(rootpath) ||
    /^privacy\.[^.]+\.[^.]+$/.test(rootpath) ||
    rootpath === "proxy.settings"
  );
}

function exploreObject(obj, rootpath = "", collectedErrors = {}) {
  if (typeof obj !== "object" || obj === null) {
    return;
  }
  for (let key of Object.keys(obj)) {
    let path = rootpath ? `${rootpath}.${key}` : key;
    if (ignorePath(path, rootpath, key)) {
      continue;
    }
    let value;
    try {
      value = obj[key];
    } catch (e) {
      console.warn(`Failed to read property: ${path}`);
      continue;
    }
    if (typeof value === "object") {
      exploreObject(value, path, collectedErrors);
      continue;
    }
    if (typeof value !== "function") {
      continue;
    }

    let err;
    try {
      value.apply(obj, INVALID_ARGUMENT_LIST);
    } catch (e) {
      err = e;
    }
    if (!err) {
      console.warn(`${path}(...) did not throw`);
      continue;
    }
    collectedErrors[path] = err.message;
  }
  return collectedErrors;
}

function schemaErrorToSignature(errorMessage) {
  // JS-based schema error.
  // https://chromium.googlesource.com/chromium/src/+/1526d82653413c5c812f1b6d869e7b29389f5398/extensions/renderer/resources/schema_utils.js#115
  // E.g. "Invocation of form alarms.clear(symbol, symbol, symbol, symbol, symbol, symbol, symbol, symbol, symbol, symbol) doesn't match definition alarms.clear(optional string name, optional function callback)"
  let tmp = /doesn't match definition [^(]+\(([^)]*)\)/.exec(errorMessage);
  if (!tmp) {
    // C++ schema error (--enable-features=NativeCrxBindings)
    // https://chromium.googlesource.com/chromium/src/+/1526d82653413c5c812f1b6d869e7b29389f5398/extensions/renderer/bindings/api_invocation_errors.cc#121
    // E.g. "Error in invocation of alarms.clear(optional string name, optional function callback): No matching signature."
    tmp = /Error in invocation of [^(]+\(([^)]*)\)/.exec(errorMessage);
  }
  if (!tmp) {
    return {
      TODO: `No signature found in: ${errorMessage}`,
    };
  }
  let params = tmp[1].split(", ");

  let countRequiredParams = args => args.filter(sig => !sig.startsWith("optional")).length;
  let hasCallback = params.length > 0 && /( |^)function /.test(params[params.length - 1]);
  if (!hasCallback) {
    // Does not take a callback as last parameter.
    return {
      minArgs: countRequiredParams(params),
      maxArgs: params.length,
      // Placeholder. We need to manually check if the API should be kept or be removed.
      fallbackToNoCallback: true,
    };
  }
  // We could check if the callback is optional by using lastparam.startsWith("optional"),
  // but since we always pass a callback in the polyfill, there is no need to distinguish
  // between the two (and we can always ignore the last parameter).
  // (At least, until there exist some API that takes two callback functions.
  //  So far, there is not any such function.)
  return {
    minArgs: countRequiredParams(params.slice(0, -1)),
    maxArgs: params.length - 1,
  };
}

/**
 * @returns {object}
 *          A dictionary that maps API paths to {minArgs,maxArgs}
 *          (and optionally "fallbackToNoCallback" if the API does not take callbacks).
 */
function generateApiMetadata() {
  let collectedErrors = exploreObject(chrome);

  let signatures = {};
  for (let [path, errorMessage] of Object.entries(collectedErrors)) {
    let signature = schemaErrorToSignature(errorMessage);
    if (signature) {
      if (signature.TODO) {
        // Manual action = figuring out the signature, e.g. by reading the documentation,
        // or by running a different version of Chrome, and/or with --enable-features=NativeCrxBindings
        console.warn(`No signature found for ${path}; needs manual fixup or a different source.`);
      }
      signatures[path] = signature;
    }
  }

  return signatures;
}

function collectAndSend() {
  let signatures = generateApiMetadata();
  let x = new XMLHttpRequest();
  x.onloadend = function() {
    console.log(`Sent ${Object.keys(signatures).length} signatures to ${x.responseURL} (${x.status})`);

    chrome.tabs.query({
      url: "data:," + chrome.runtime.getManifest().short_name,
    }, function(tabs) {
      // If the tab exists and if it is the last one, then the browser will shut down.
      chrome.tabs.remove(tabs[0].id);
    });
  };
  x.open("POST", "http://127.0.0.1:55781/"); // This PORT must match collector.js
  x.send(JSON.stringify(signatures));
}

collectAndSend();
