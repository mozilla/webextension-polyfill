const browserify = require("browserify");

const b = browserify();

b.add("./test/fixtures/tape-standalone.js");
b.transform("global-replaceify", {
  global: true,
  replacements: {
    setImmediate: "require('timers').setImmediate",
  },
});
b.bundle().pipe(process.stdout);
