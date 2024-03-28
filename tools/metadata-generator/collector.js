#!/usr/bin/env node
/* eslint-env node */

var PORT = 55781; // A random number, chosen with (Math.random() * 0xFFFF | 0)
// The above number must match the PORT in explorer.js

var collectedSignatures = {};

// The set of APIs with a mismatching callback (i.e one client says optional,
// the other says required).
var mismatchedCallbacks = new Set();

function mergeSignatures(sigs) {
  let newcount = 0;
  for (let [path, newSig] of Object.entries(sigs)) {
    let oldSig = collectedSignatures[path];
    if (newSig.TODO) {
      if (!oldSig || oldSig.TODO) {
        collectedSignatures[path] = newSig;
      }
      // Otherwise the signature is known and we ignore the TODO.
      continue;
    }
    if (!oldSig || oldSig.TODO) {
      collectedSignatures[path] = newSig;
      ++newcount;
    } else {
      if (oldSig.minArgs !== newSig.minArgs) {
        console.log(`${path} mismatch in minArgs, taking the minimum (${oldSig.minArgs} vs ${newSig.minArgs})`);
        oldSig.minArgs = Math.min(oldSig.minArgs, newSig.minArgs);
      }
      if (oldSig.maxArgs !== newSig.maxArgs) {
        console.log(`${path} mismatch in maxArgs, taking the maximum (${oldSig.maxArgs} vs ${newSig.maxArgs})`);
        oldSig.maxArgs = Math.max(oldSig.maxArgs, newSig.maxArgs);
      }
      if (oldSig.fallbackToNoCallback !== newSig.fallbackToNoCallback) {
        console.log(`${path} mismatch in fallbackToNoCallback, assuming true`);
        oldSig.fallbackToNoCallback = true;
        mismatchedCallbacks.add(path);
      }
    }
  }
  console.log(`Imported ${Object.keys(sigs).length} signatures (${newcount} new).`);
  let todocount = Object.values(collectedSignatures).filter(sig => sig.TODO).length;
  if (todocount) {
    console.log(`${todocount} signatures are invalid. Fix this by running Chrome with and without --enable-features=NativeCrxBindings.`);
  } else {
    console.log(`All collected signatures are valid.`);
  }
  console.log(`The API metadata collected so far is available as JSON via GET:
   http://127.0.0.1:${PORT}/         has all data.
   http://127.0.0.1:${PORT}/subset   only returns the common namespaces.
  `);
}

/**
 * Sets obj.path = value, expanding path if there are any dots inside.
 *
 * @param {object} obj
 * @param {string} path
 * @param {object} value
 */
function setPathValue(obj, path, value) {
  let parts = path.split(".");
  for (let part of parts.slice(0, -1)) {
    if (!obj[part]) {
      obj[part] = {};
    }
    obj = obj[part];
  }
  obj[parts.pop()] = value;
}

function generateObjectWithSortedKeys(obj) {
  let res = {};
  for (let key of Object.keys(obj).sort()) {
    res[key] = obj[key];
  }
  return res;
}

function serializeSignatures(signatures, subset) {
  // Sort inputs to have a stable output format.
  signatures = generateObjectWithSortedKeys(signatures);

  let result = {};
  for (let [path, signature] of Object.entries(signatures)) {
    if (signature.TODO) {
      console.log(`${path} has no known signature. Reason: ${signature.TODO}`);
      continue;
    }
    if (signature.fallbackToNoCallback && !mismatchedCallbacks.has(path)) {
      continue;
    }
    setPathValue(result, path, signature);
  }

  if (subset) {
    let metadatalocation = require("path").join(__dirname, "..", "..", "api-metadata.json");
    let metadata = require("fs").readFileSync(metadatalocation, {encoding: "utf-8"});
    let parsed = JSON.parse(metadata);
    for (let namespaceroot of Object.keys(result)) {
      if (!parsed.hasOwnProperty(namespaceroot)) {
        console.log(`${namespaceroot} is not in ${metadatalocation} and therefore excluded.`);
        delete result[namespaceroot];
      }
    }
  }

  return JSON.stringify(result, null, 2);
}

require("http").createServer(function(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(serializeSignatures(collectedSignatures, req.url === "/subset"));
    return;
  }
  let buffers = [];
  req.on("data", function(chunk) {
    buffers.push(chunk);
  });
  req.on("end", function() {
    res.end();

    let data = Buffer.concat(buffers).toString("utf8");
    // Note: We trust the client to provide valid JSON.
    try {
      mergeSignatures(JSON.parse(data));
    } catch (e) {
      console.log(`Failed to import signatures: ${e}`);
      return;
    }
  });
}).listen(PORT, "127.0.0.1", function() {
  console.log(`
Started server at http://127.0.0.1:${PORT}
Now start Chrome and load the extensions from:
extension-apis/
extension-apis/browseraction/
`);
  // (^ In case you wonder, the extensions are nested so that they can share
  //    a script, located at the deepest directory level.)
});
