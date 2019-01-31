console.log("devtools page loaded");

browser.runtime.onMessage.addListener(async msg => {
  switch (msg.apiMethod) {
    case "devtools.inspectedWindow.eval": {
      const evalResult = await browser.devtools.inspectedWindow.eval(...msg.params);
      return {evalResult};
    }
  }

  throw new Error(`devtools_page received an unxpected message: ${msg}`);
});

browser.runtime.connect({name: "devtools_page"});
