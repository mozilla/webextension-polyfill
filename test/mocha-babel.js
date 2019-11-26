require("@babel/register")({
  presets: [["@babel/env", {
    targets: {
      node: "current",
    },
  }]],
});
