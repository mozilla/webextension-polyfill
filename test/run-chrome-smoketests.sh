echo "\nTest webextension-polyfill from an extension running on chrome"
echo "==============================================="

export TEST_EXTENSIONS_PATH=/tmp/browser-polyfill-chrome-smoketests

MARKER_FILE=$TEST_EXTENSIONS_PATH/.created-for-run-chrome-smoketests

# Check if the marker file exists and then remove the directory.
if [ -f $MARKER_FILE ]; then
    rm -fr $TEST_EXTENSIONS_PATH
fi

## Exits immediately if the directory already exists (which can only happen in a local
## development environment, while this test will usually run on travis).
mkdir $TEST_EXTENSIONS_PATH || exit 1
touch $MARKER_FILE

cp -rf test/fixtures/runtime-messaging-extension $TEST_EXTENSIONS_PATH
cp -rf dist/browser-polyfill.js* $TEST_EXTENSIONS_PATH/runtime-messaging-extension/

npm run test-integration
