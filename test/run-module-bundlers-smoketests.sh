#!/bin/bash
set -eo pipefail

DIRNAME=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )
export PATH=$PATH:$DIRNAME/node_modules/.bin/

echo ""
echo "Test webextension-polyfill bundled with webpack"
echo "==============================================="

webpack --mode production --entry ./test/fixtures/bundle-entrypoint.js --output /tmp/webpack-bundle.js
TEST_BUNDLED_POLYFILL=/tmp/webpack-bundle.js npm run test

echo ""
echo "Test webextension-polyfill bundled with browserify"
echo "=================================================="

browserify test/fixtures/bundle-entrypoint.js > /tmp/browserify-bundle.js
TEST_BUNDLED_POLYFILL=/tmp/browserify-bundle.js npm run test
