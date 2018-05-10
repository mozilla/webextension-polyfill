console.log(name, "background page loaded");

async function testMessageHandler(msg, sender) {
  console.log(name, "background received msg", {msg, sender});

  // We only expect messages coming from a content script in this test.
  if (!sender.tab || !msg.startsWith("test-multiple-onmessage-listeners:")) {
    return {
      success: false,
      failureReason: `An unexpected message has been received: ${JSON.stringify({msg, sender})}`,
    };
  }

  if (msg.endsWith(":resolve-to-undefined")) {
    return undefined;
  }

  if (msg.endsWith(":resolve-to-null")) {
    return null;
  }

  return {
    success: false,
    failureReason: `An unexpected message has been received: ${JSON.stringify({msg, sender})}`,
  };
}

// Register the same message handler twice.
browser.runtime.onMessage.addListener(testMessageHandler);
browser.runtime.onMessage.addListener(testMessageHandler);

// Register an additional message handler that always reply after
// a small latency time.
browser.runtime.onMessage.addListener(async (msg, sender) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return "resolved-to-string-with-latency";
});

console.log(name, "background page ready to receive a content script message...");
