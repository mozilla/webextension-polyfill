test("devtools.inspectedWindow.eval resolved with an error result", async (t) => {
  const {evalResult} = await browser.runtime.sendMessage({
    apiMethod: "devtools.inspectedWindow.eval",
    params: ["throw new Error('fake error');"],
  });

  t.ok(Array.isArray(evalResult), "devtools.inspectedWindow.eval should resolve to an array");

  t.equal(evalResult[0], navigator.userAgent.includes("Firefox/") ? undefined : null,
          "the first element should be null (on chrome) or undefined (on firefox)");

  t.ok(evalResult[1].isException, "the second element should represent an exception");
  t.ok(evalResult[1].value && evalResult[1].value.includes("fake error"),
       "the second element value property should include the expected error message");
});

test("devtools.inspectedWindow.eval resolved without an error result", async (t) => {
  const {evalResult} = await browser.runtime.sendMessage({
    apiMethod: "devtools.inspectedWindow.eval",
    params: ["[document.documentElement.localName]"],
  });

  t.ok(Array.isArray(evalResult), "devtools.inspectedWindow.eval should resolve to an array");

  if (navigator.userAgent.includes("Firefox/")) {
    t.deepEqual(evalResult, [["html"], undefined], "got the expected values in the array");
  } else {
    t.deepEqual(evalResult, [["html"]], "got the expected values in the array");
  }
});
