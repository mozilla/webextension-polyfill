require("@babel/register").default({
  presets: [["@babel/preset-env", {
    targets: {
      node: "current",
    },
  }]],
});
