# WebExtension `browser` API Polyfill [![Build Status](https://travis-ci.org/mozilla/webextension-polyfill.svg?branch=master)](https://travis-ci.org/mozilla/webextension-polyfill) [![npm version](https://badge.fury.io/js/webextension-polyfill.svg)](https://www.npmjs.com/package/webextension-polyfill)

This library allows extensions that use the Promise-based WebExtension/BrowserExt API being standardized by the
[W3 Browser Extensions][w3-browserext] group to run on Google Chrome with minimal or no changes.

> This library doesn't (and it is not going to) polyfill API methods or options that are missing on Chrome but natively provided
> on Firefox, and so the extension has to do its own "runtime feature detection" in those cases (and then eventually polyfill the
> missing feature on its own or enable/disable some of the features accordingly).

[w3-browserext]: https://www.w3.org/community/browserext/

Table of contents
=================

* [Supported Browsers](#supported-browsers)
* [Installation](#installation)
* [Basic Setup](#basic-setup)
  * [Basic Setup with ES6 module loader](#basic-setup-with-es6-module-loader)
  * [Basic Setup with module bundlers](#basic-setup-with-module-bundlers)
  * [Usage with webpack without bundling](#usage-with-webpack-without-bundling)
* [Using the Promise-based APIs](#using-the-promise-based-apis)
* [Examples](#examples)
* [Usage with TypeScript](#usage-with-typescript)
* [Known Limitations and Incompatibilities](#known-limitations-and-incompatibilities)
* [Contributing to this project](#contributing-to-this-project)

Supported Browsers
==================

| Browser                   | Support Level                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Chrome                    | *Officially Supported* (with automated tests)                                                        |
| Firefox                   | *Officially Supported as a NO-OP* (with automated tests for comparison with the behaviors on Chrome) |
| Opera / Edge (>=79.0.309) | *Unofficially Supported* as a Chrome-compatible target (but not explicitly tested in automation)     |

The polyfill is being tested explicitly (with automated tests that run on every pull request) on **officially supported** 
browsers (that are currently the last stable versions of Chrome and Firefox).

On Firefox, this library is actually acting as a NO-OP: it detects that the `browser` API object is already defined 
and it does not create any custom wrappers.
Firefox is still included in the automated tests, to ensure that no wrappers are being created when running on Firefox,
and for comparison with the behaviors implemented by the library on Chrome.

## Installation

A new version of the library is built from this repository and released as an npm package.

The npm package is named after this repo: [webextension-polyfill](https://www.npmjs.com/package/webextension-polyfill).

For the extension that already include a package.json file, the last released version of this library can be quickly installed using:

```
npm install --save-dev webextension-polyfill
```

Inside the `dist/` directory of the npm package, there are both the minified and non-minified builds (and their related source map files):

- node_modules/webextension-polyfill/dist/browser-polyfill.js
- node_modules/webextension-polyfill/dist/browser-polyfill.min.js

For extensions that do not include a package.json file and/or prefer to download and add the library directly into their own code repository, all the versions released on npm are also available for direct download from unpkg.com:

- https://unpkg.com/webextension-polyfill/dist/

and linked to the Github releases:

- https://github.com/mozilla/webextension-polyfill/releases

## Basic Setup

In order to use the polyfill, it must be loaded into any context where `browser` APIs are accessed. The most common cases
are background and content scripts, which can be specified in `manifest.json` (make sure to include the `browser-polyfill.js` script before any other scripts that use it):

```javascript
{
  // ...

  "background": {
    "scripts": [
      "browser-polyfill.js",
      "background.js"
    ]
  },

  "content_scripts": [{
    // ...
    "js": [
      "browser-polyfill.js",
      "content.js"
    ]
  }]
}
```

For HTML documents, such as `browserAction` popups, or tab pages, it must be
included more explicitly:

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="application/javascript" src="browser-polyfill.js"></script>
    <script type="application/javascript" src="popup.js"></script>
  </head>
  <!-- ... -->
</html>
```

And for dynamically-injected content scripts loaded by `tabs.executeScript`,
it must be injected by a separate `executeScript` call, unless it has
already been loaded via a `content_scripts` declaration in
`manifest.json`:

```javascript
browser.tabs.executeScript({file: "browser-polyfill.js"});
browser.tabs.executeScript({file: "content.js"}).then(result => {
  // ...
});
```

### Basic Setup with ES6 module loader

The polyfill can also be loaded using the native ES6 module loader available in
the recent browsers versions.

Be aware that the polyfill module does not export the `browser` API object,
but defines the `browser` object in the global namespace (i.e. `window`).

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="browser-polyfill.js"></script>
    <script type="module" src="background.js"></script>
  </head>
  <!-- ... -->
</html>
```

```javascript
// In background.js (loaded after browser-polyfill.js) the `browser`
// API object is already defined and provides the promise-based APIs.
browser.runtime.onMessage.addListener(...);
```

### Basic Setup with module bundlers

This library is built as a **UMD module** (Universal Module Definition), and so it can also be used with module bundlers (and explicitly tested on both **webpack** and **browserify**) or AMD module loaders.

**src/background.js**:
```javascript
var browser = require("webextension-polyfill");

browser.runtime.onMessage.addListener(async (msg, sender) => {
  console.log("BG page received message", msg, "from", sender);
  console.log("Stored data", await browser.storage.local.get());
});

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.executeScript({file: "content.js"});
});
```

**src/content.js**:
```javascript
var browser = require("webextension-polyfill");

browser.storage.local.set({
  [window.location.hostname]: document.title,
}).then(() => {
  browser.runtime.sendMessage(`Saved document title for ${window.location.hostname}`);
});
```

By using `require("webextension-polyfill")`, the module bundler will use the non-minified version of this library, and the extension is supposed to minify the entire generated bundles as part of its own build steps.

If the extension doesn't minify its own sources, it is still possible to explicitly ask the module bundler to use the minified version of this library, e.g.:

```javascript
var browser = require("webextension-polyfill/dist/browser-polyfill.min");

...
```

### Usage with webpack without bundling

The previous section explains how to bundle `webextension-polyfill` in each script. An alternative method is to include a single copy of the library in your extension, and load the library as shown in [Basic Setup](#basic-setup). You will need to install [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin):

```sh
npm install --save-dev copy-webpack-plugin
```

**In `webpack.config.js`,** import the plugin and configure it this way. It will copy the minified file into your _output_ folder, wherever your other webpack files are generated.

```js
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  /* Your regular webpack config, probably including something like this:
  output: {
    path: path.join(__dirname, 'distribution'),
    filename: '[name].js'
  },
  */
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
      }],
    })
  ]
}
```

And then include the file in each context, using the `manifest.json` just like in [Basic Setup](#basic-setup).

## Using the Promise-based APIs

The Promise-based APIs in the `browser` namespace work, for the most part,
very similarly to the callback-based APIs in Chrome's `chrome` namespace.
The major differences are:

* Rather than receiving a callback argument, every async function returns a
  `Promise` object, which resolves or rejects when the operation completes.

* Rather than checking the `chrome.runtime.lastError` property from every
  callback, code which needs to explicitly deal with errors registers a
  separate Promise rejection handler.

* Rather than receiving a `sendResponse` callback to send a response,
  `onMessage` listeners simply return a Promise whose resolution value is
  used as a reply.

* Rather than nesting callbacks when a sequence of operations depend on each
  other, Promise chaining is generally used instead.

* The resulting Promises can be also used with `async` and `await`, rather
  than dealt with directly.

## Examples

The following code will retrieve a list of URLs patterns from the `storage`
API, retrieve a list of tabs which match any of them, reload each of those
tabs, and notify the user that is has been done:

```javascript
browser.storage.local.get("urls").then(({urls}) => {
  return browser.tabs.query({url: urls});
}).then(tabs => {
  return Promise.all(
    Array.from(tabs, tab => browser.tabs.reload(tab.id))
  );
}).then(() => {
  return browser.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Tabs reloaded",
    message: "Your tabs have been reloaded",
  });
}).catch(error => {
  console.error(`An error occurred while reloading tabs: ${error.message}`);
});
```

Or, using an async function:

```javascript
async function reloadTabs() {
  try {
    let {urls} = await browser.storage.local.get("urls");

    let tabs = await browser.tabs.query({url: urls});

    await Promise.all(
      Array.from(tabs, tab => browser.tabs.reload(tab.id))
    );

    await browser.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Tabs reloaded",
      message: "Your tabs have been reloaded",
    });
  } catch (error) {
    console.error(`An error occurred while reloading tabs: ${error.message}`);
  }
}
```

It's also possible to use Promises effectively using two-way messaging.
Communication between a background page and a tab content script, for example,
looks something like this from the background page side:

```javascript
browser.tabs.sendMessage(tabId, "get-ids").then(results => {
  processResults(results);
});
```

And like this from the content script:

```javascript
browser.runtime.onMessage.addListener(msg => {
  if (msg == "get-ids") {
    return browser.storage.local.get("idPattern").then(({idPattern}) => {
      return Array.from(document.querySelectorAll(idPattern),
                        elem => elem.textContent);
    });
  }
});
```

or:

```javascript
browser.runtime.onMessage.addListener(async function(msg) {
  if (msg == "get-ids") {
    let {idPattern} = await browser.storage.local.get("idPattern");

    return Array.from(document.querySelectorAll(idPattern),
                      elem => elem.textContent);
  }
});
```

Or vice versa.

## Usage with TypeScript

There are multiple projects that add TypeScript support to your web-extension project:

| Project | Description |
| ------------- | ------------- |
| [webextension-polyfill-ts](https://github.com/Lusito/webextension-polyfill-ts) | Types and JS-Doc are automatically generated from the mozilla schema files, so it is always up-to-date with the latest APIs. It also bundles the webextension-polyfill for very simple usage. |
| [web-ext-types](https://github.com/kelseasy/web-ext-types) | Manually maintained types based on MDN's documentation. No JS-Doc included. |
| [@types/chrome](https://www.npmjs.com/package/@types/chrome) | Manually maintained types and JS-Doc. Only contains types for chrome extensions though! |

## Known Limitations and Incompatibilities

This library tries to minimize the amount of "special handling" that a cross-browser extension has to do to be able to run on the supported browsers from a single codebase, but there are still cases when polyfillling the missing or incompatible behaviors or features is not possible or out of the scope of this polyfill.

This section aims to keep track of the most common issues that an extension may have.

### No callback supported by the Promise-based APIs on Chrome

While some of the asynchronous API methods in Firefox (the ones that return a promise) also support the callback parameter (mostly as a side effect of the backward compatibility with the callback-based APIs available on Chrome), the Promise-based APIs provided by this library do not support the callback parameter (See ["#102 Cannot call browser.storage.local.get with callback"][I-102]).

### No promise returned on Chrome for some API methods

This library takes its knowledge of the APIs to wrap and their signatures from a metadata JSON file:
[api-metadata.json](api-metadata.json).

If an API method is not yet included in this "API metadata" file, it will not be recognized.
Promises are not supported for unrecognized APIs, and callbacks have to be used for them.

Chrome-only APIs have no promise version, because extensions that use such APIs
would not be compatible with Firefox.

File an issue in this repository for API methods that support callbacks in Chrome *and*
Firefox but are currently missing from the "API metadata" file.

### Issues that happen only when running on Firefox

When an extension that uses this library doesn't behave as expected on Firefox, it is almost never an issue in this polyfill, but an issue with the native implementation in Firefox.

"Firefox only" issues should be reported upstream on Bugzilla:
- https://bugzilla.mozilla.org/enter_bug.cgi?product=WebExtensions&component=Untriaged

### API methods or options that are only available when running in Firefox

This library does not provide any polyfill for API methods and options that are only available on Firefox, and they are actually considered out of the scope of this library.

### tabs.executeScript

On Firefox `browser.tabs.executeScript` returns a promise which resolves to the result of the content script code that has been executed, which can be an immediate value or a Promise.

On Chrome, the `browser.tabs.executeScript` API method as polyfilled by this library also returns a promise which resolves to the result of the content script code, but only immediate values are supported.
If the content script code result is a Promise, the promise returned by `browser.tabs.executeScript` will be resolved to `undefined`.

### MSEdge support

MSEdge versions >= 79.0.309 are unofficially supported as a Chrome-compatible target (as for Opera or other Chrome-based browsers that also support extensions).

MSEdge versions older than 79.0.309 are **unsupported**, for extension developers that still have to work on extensions for older MSEdge versions, the MSEdge `--ms-preload` manifest key and the [Microsoft Edge Extension Toolkit](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/porting-chrome-extensions)'s Chrome API bridge can be used to be able to load the webextension-polyfill without any MSEdge specific changes.

The following Github repository provides some additional detail about this strategy and a minimal test extension that shows how to put it together:

- https://github.com/rpl/example-msedge-extension-with-webextension-polyfill

## Contributing to this project

Read the [contributing section](CONTRIBUTING.md) for additional information about how to build the library from this repository and how to contribute and test changes.

[PR-114]: https://github.com/mozilla/webextension-polyfill/pull/114
[I-102]: https://github.com/mozilla/webextension-polyfill/issues/102#issuecomment-379365343
