echo "\nTest webextension-polyfill on real browsers"
echo "============================================"

export PATH=$PATH:./node_modules/.bin/

## HEADLESS=1 Enable the headless mode (currently used only on Firefox
## because Chrome doesn't currently support the extensions in headless mode)
export HEADLESS=1

echo "\nRun smoketests on Chrome"
TEST_BROWSER_TYPE=chrome npm run test-integration | tap-nirvana

echo "\nRun smoketests on Firefox"
TEST_BROWSER_TYPE=firefox npm run test-integration | tap-nirvana