/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
"use strict";

/* eslint-env commonjs */

const LICENSE = `/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */`;

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    coveralls: {
      all: {
        src: "coverage/lcov.info",
      },
    },

    eslint: {
      src: ["src/browser-polyfill.js", "Gruntfile.js"],
      test: ["test/**/*.js"],
    },

    replace: {
      dist: {
        options: {
          patterns: [
            {
              match: /require\("..\/(.*?)"\)/,
              replacement: (match, filename) => {
                return grunt.file.read(filename)
                            .replace(/\n$/, "")
                            .replace(/^[^{]/gm, "    $&");
              },
            },
            {
              json: {
                "package_name": "<%= pkg.name %>",
                "version": "<%= pkg.version %>",
                "timestamp": "<%= grunt.template.today() %>",
              },
            },
          ],
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ["src/browser-polyfill.js"],
            dest: "dist/",
          },
        ],
      },
    },

    umd: {
      all: {
        src: "dist/browser-polyfill.js",
        template: "unit",
        globalAlias: "browser",
        amdModuleId: "webextension-polyfill",
      },
    },

    "closure-compiler": {
      dist: {
        files: {
          "dist/browser-polyfill.min.js": ["dist/browser-polyfill.js"],
        },
        options: {
          // Closure currently supports only whitespace and comment stripping
          // when both the input and output languages are ES6.
          compilation_level: "WHITESPACE_ONLY",
          language_in: "ECMASCRIPT6_STRICT",
          language_out: "ECMASCRIPT6",
          output_wrapper: `${LICENSE}\n%output%`,
        },
      },
    },

    // This currently does not support ES6 classes.
    uglify: {
      options: {
        banner: LICENSE,
        compress: true,
      },

      dist: {
        files: {
          "dist/browser-polyfill.min.js": ["dist/browser-polyfill.js"],
        },
      },
    },
  });

  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-replace");
  grunt.loadNpmTasks("grunt-umd");
  grunt.loadNpmTasks("grunt-coveralls");
  require("google-closure-compiler").grunt(grunt);

  grunt.registerTask("default", ["eslint", "replace", "umd", "closure-compiler"]);
};
