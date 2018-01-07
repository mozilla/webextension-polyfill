# WebExtension `browser` API Polyfill [![Build Status](https://travis-ci.org/mozilla/webextension-polyfill.svg?branch=master)](https://travis-ci.org/mozilla/webextension-polyfill)

This library allows extensions written for the Promise-based
WebExtension/BrowserExt API being standardized by the [W3 Browser
Extensions][w3-browserext] group to be used without modification in Google
Chrome.

[w3-browserext]: https://www.w3.org/community/browserext/


Table of contents
=================

* [Building](#building)
* [Basic Setup](#basic-setup)
* [Using the Promise-based APIs](#using-the-promise-based-apis)
* [Examples](#examples)

---

## Building

To build, assuming you're already installed [node >= 6](https://nodejs.org) and
[npm](https://www.npmjs.com/), simply run:

```sh
npm install
npm run build
npm run test
```

This will install all the npm dependencies and build both non-minified and minified versions
of the final library, and output them to `dist/browser-polyfill.js` and `dist/browser-polyfill.min.js`,
respectively, and finally executes the unit tests on the generated dist files.

---

## Basic Setup

In order to use the polyfill, it must be loaded into any context where
`browser` APIs are accessed. The most common cases are background and
content scripts, which can be specified in `manifest.json`:

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

---

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

* For users of an ES7 transpiler, such as Babel, the resulting Promises are
  generally used with `async` and `await`, rather than dealt with
  directly.

---

## Examples

The following code will retrieve a list of URLs patterns from the `storage`
API, retrieve a list of tabs which match any of them, reload each of those
tabs, and notify the user that is has been done:

```javascript
browser.storage.get("urls").then(({urls}) => {
  return browser.tabs.query({url: urls});
}).then(tabs => {
  return Promise.all(
    Array.from(tabs, tab => browser.tabs.reload(tab.id)));
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
    let {urls} = await browser.storage.get("urls");

    let tabs = await browser.tabs.query({url: urls});

    await Promise.all(
      Array.from(tabs, tab => browser.tabs.reload(tab.id)));
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
browser.tabs.sendMessage("get-ids").then(results => {
  processResults(results);
});
```

And like this from the content script:

```javascript
browser.runtime.onMessage.addListener(msg => {
  if (msg == "get-ids") {
    return browser.storage.get("idPattern").then(({idPattern}) => {
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
    let {idPattern} = await browser.storage.get("idPattern");

    return Array.from(document.querySelectorAll(idPattern),
                      elem => elem.textContent);
  }
});
```

Or vice versa.
