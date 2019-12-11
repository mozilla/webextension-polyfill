const {template, types} = require("@babel/core");

const buildWrapper = template(`
  (function (global, factory) {
    if (typeof define === "function" && define.amd) {
      define(AMD_MODULE_NAME, ["module"], factory);
    } else if (typeof exports !== "undefined") {
      factory(module);
    } else {
      var mod = { exports: {} };
      factory(mod);
      global.GLOBAL = mod.exports;
    }
  })(
    typeof globalThis !== "undefined" ? globalThis
      : typeof self !== "undefined" ? self
      : this,
    function(module) {
    }
  )
`);

module.exports = (api, options = {}) => {
  api.assertVersion(7);

  if (typeof options.globalName != "string") {
    throw new Error("globalName option is mandatory");
  }

  if (typeof options.amdModuleName != "string") {
    throw new Error("amdModuleName is mandatory");
  }

  return {
    name: "transform-to-umd-module",

    visitor: {
      Program: {
        exit(path) {
          const {body, directives} = path.node;
          path.node.directives = [];
          path.node.body = [];

          const umdWrapper = path.pushContainer(
            "body",
            buildWrapper({
              AMD_MODULE_NAME: types.stringLiteral(options.amdModuleName),
              GLOBAL: options.globalName,
            })
          )[0];
          const umdFactory = umdWrapper
            .get("expression.arguments")[1]
            .get("body");

          umdFactory.pushContainer("directives", directives);
          umdFactory.pushContainer("body", body);
        },
      },
    },
  };
};
