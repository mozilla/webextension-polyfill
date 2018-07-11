Hi! Thanks for your interest in helping to make the "cross-browser extension" developers life easier by contributing to the `webextension-polyfill` library.

This document provides some additional information that you may find useful while looking at how to apply changes to this library and submit them for review.

Table of contents
=================

* [Building](#building)
* [Test Suites](#test-suites)
* [Writing commit messages](#writing-commit-messages)

## Building

To build, assuming you've already installed [node >= 6](https://nodejs.org) and
[npm](https://www.npmjs.com/), simply run:

```sh
git clone https://github.com/mozilla/webextension-polyfill.git

cd webextension-polyfill

npm install

npm run test
```

This will install all the npm dependencies and build both non-minified and minified versions
of the final library, and output them to `dist/browser-polyfill.js` and `dist/browser-polyfill.min.js`,
respectively, and finally execute the unit tests on the generated dist files.

## Test Suites

This project provides two test suites:

- unit tests (which only require Node.js to run)
- module bundlers smoke tests (which requires also browserify and webpack to be installed globally)
- integration tests (which requires also a stable version of Chrome and Firefox)

### Unit Tests

The unit tests run in Node.js with [Mocha](https://mochajs.org), and use jsdom and 
[Sinon](https://sinonjs.org) to mock a browser-like environment for testing the library.

The unit tests are located in the `"test/"` directory and they have to be named `"test/test-*.js"`. 

`npm run test` run all the unit tests on the non-minified version of the library,
whereas `npm run test-minified` can be used to run the unit tests on the minified version.

Optionally code coverage data can be collected and reported while running the unit tests, 
by running `npm run test-coverage`.

### Module Bundler smoketests

The shell script `test/run-module-bundlers-smoketests.sh` runs browserify and webpack, 
to verify that the most commonly used module bundlers are not raising any unexpected error 
while building a bundle that requires this library.

### Integration Tests

This repository also includes a small set of integration tests, located at `"test/integration/"`.
The integration tests use selenium-webdriver to run a set of test extensions 
(located at `"test/fixtures/"`) on real browsers, currently Chrome (as the browser officially 
supported by this library) and Firefox (to compare the polyfilled APIs with the ones natively 
provided on Firefox).

The shell script `test/run-browsers-smoketests.sh` (executed by the Travis CI service on every
pull request) runs this test suite on both the browsers.

To run the integration tests on a single browser:

```sh
TEST_BROWSER_TYPE=chrome npm run test-integration
```
or

```sh
TEST_BROWSER_TYPE=firefox npm run test-integration
```

These tests emit their results using the TAP protocol. To get a nicer output on the console 
you may want to pipe the results to `tap-nirvana`, e.g.

```sh
TEST_BROWSER_TYPE=chrome npm run test-integration | ./node_modules/.bin/tap-nirvana
```

## Writing commit messages

The subject of the pull requests and commit messages must adhere to the Angular style of
[semantic messages](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits).
This allows us to auto-generate a changelog without too much noise in it.
Additionally, write the commit message in past tense so it will read
naturally as a historic changelog.

Examples:
* `feat: Added newAmazingAPI namespace to the metadata`
* `fix: newAmazingAPI.create should reject on errors`
* `docs: Improved contributor docs`
* `style: Added no-console linting, cleaned up code`
* `refactor: Split out myHelperFunction`
* `perf: Changed myHelperFunction to be 2x faster`
* `test: Added more tests for newAmazingAPI`
* `chore: Upgraded yargs to 3.x.x`

If you want to use scopes then it would look more like:
`test(integration): Added test extension for newAmazingAPI`.
