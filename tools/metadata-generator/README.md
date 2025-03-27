This tool collects the API namespaces from Chrome.

### Usage

1. Start `./collector.js`
2. Start Chrome and load the two extensions (there are two extensions because
   it is not possible to have one extension with all APIs).
3. Start Chrome again, with `--enable-features=NativeCrxBindings` and load one
   of the two extensions.
4. To support older versions of Chrome (which may have different API expectations),
   repeat step 3 for each version of Chrome.

When you are done, the collected metadata is available at http://127.0.0.1:55781/

To only see the namespaces that already exist in api-manifest.json, visit
http://127.0.0.1:55781/subset

Then use jsondiff, e.g. jsondiff.com to compare the old and new metadata.


### Example
For example, to collect the metadata from multiple sources:

```sh
node ./collector.js

# Now in a different terminal:
chromium --no-first-run --user-data-dir=/tmp/whatever --load-extension=extension-apis,extension-apis/browseraction data:,extension-apis data:,browseraction
chromium --no-first-run --user-data-dir=/tmp/whatever --load-extension=extension-apis --enable-features=NativeCrxBindings data:,extension-apis

# If repeating the last line for old Chrome versions, remove the profile dir
# first using:   rm -r /tmp/whatever

# See JSON output in stdout
curl http://127.0.0.1:55781/subset

# When you are done, go back to the terminal that runs collector.js and ^C
```

Explanation of above commands:

- `--load-extension=comma-separated-list-of-directories to load extension(s).
- `data:,extension-apis` is a data-URL.
  The part after "data:," matches with the `short_name` value in manifest.json.
  After collecting the API information, the extension will look for a tab with
  such a URL and close it. If it is the last tab, Chrome will automatically
  shut down.
- `--enable-features=NativeCrxBindings` forces Chrome to use C++ extension
  bindings. These have more consistent error messages, except for some APIs
  such as the storage API ( https://crbug.com/848904 ). If this bug is fixed,
  then it suffices to run Chrome only once (always with this flag enabled).

### Analysis
After collecting the data, you can use diff tools of your choice to check for
differences. Examples:

```sh
# Assuming that the server is still up:
colordiff -u ../../api-metadata.json <(curl http://127.0.0.1:55781/subset)

# Or if you saved the result, e.g. as out.json
curl http://127.0.0.1:55781/subset > out.json
colordiff -u ../../api-metadata.json out.json
```
