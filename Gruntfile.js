/* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* vim: set sts=2 sw=2 et tw=80: */
"use strict";

/* eslint-env commonjs */

const LICENSE = `/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */`;

const MINIFIED_FILE_FOOTER = `\n\n// <%= pkg.name %> v.<%= pkg.version %> (<%= pkg.homepage %>)\n\n${LICENSE}`;

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
              match: /\{\/\* include\("(.*?)"\) \*\/\}/,
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

    babel: {
      minify: {
        options: {
          babelrc: false,
          comments: false,
          presets: ["babili"],
          sourceMap: true,
        },
        files: {
          "dist/browser-polyfill.min.js": "dist/browser-polyfill.js",
        },
      },
      umd: {
        options: {
          babelrc: false,
          comments: true,
          plugins: [
            ["transform-es2015-modules-umd", {
              globals: {
                "webextension-polyfill": "browser",
              },
              exactGlobals: true,
            }],
          ],
          sourceMap: true,
          moduleId: "webextension-polyfill",
        },
        files: {
          "dist/browser-polyfill.js": "dist/browser-polyfill.js",
        },
      },
    },

    concat: {
      license: {
        src: "dist/browser-polyfill.min.js",
        dest: "dist/browser-polyfill.min.js",
        options: {footer: MINIFIED_FILE_FOOTER},
      },
    },
  });

  grunt.util.linefeed = "\n";

  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-replace");
  grunt.loadNpmTasks("grunt-coveralls");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-babel");

  grunt.registerTask("default", ["eslint", "replace", "babel:umd", "babel:minify", "concat:license"]);
};
