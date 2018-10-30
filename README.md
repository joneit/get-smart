# get-smart
<sup>AJAX function to smartly GET .js modules, .json objects, .css stylesheets, and .snippets array; else raw text</sup>

This function performs a basic asynchronous [**AJAX**](https://en.wikipedia.org/wiki/Ajax_(programming)) call that interprets results based solely on the filename extensions listed above; unlisted extensions (including no extension) returns the raw text contents of the file. MIME type is always ignored.

## Access

```js
var getSmart = require('get-smart');
```

As an alternative to using the npm module, the client may request a versioned build file that sets the global `window.getSmart`:
```html
<script src="https://unpkg.com/get-smart@1.1/umd/get-smart.js"></script>
<script src="https://unpkg.com/get-smart@1.1/umd/get-smart.min.js"></script>
```
Any [SEMVER](//semver.org) string can be used. `1.1` in the above means load the latest of the 1.1.* range. See the [npm semver calculator](//semver.npmjs.com) and npm’s [semantic versioning](https://docs.npmjs.com/misc/semver) page.

## Usage

### String URL
```js
var myApi; // receives the value of `module.exports` set in my-api.js
getSmart('my-api.js', function(api) { myApi = api; });

var myStyleEl; // receives a <style> element with innerHTML set to contents of my-stylesheet.css
getSmart('my-stylesheet.css', function(styleEl) { myStyleEl = styleEl; });

var myObject; // receives an object (or array) JSON.parse'd from the contents of my-data.json
getSmart('my-data.json', function(json) { myObject = json; });

var mySnippets; // receives array of string from my-notes.snippets split by getSmart.snip ("\n// ---snip---\n")
getSmart('my-notes.snippets', function(array) { mySnippets = array; });

var myText; // receives contents of my-story.txt entirely as raw text (any other extension or no extension)
getSmart('my-story.txt', function(text) { myText = text; });
```

In the case of JavaScript files, each file is read in, closed over, and executed.
The closure has access to locals `exports`, `module`, and `require`.
(The `require` is supported is _anychronous;_ see [note below](#a-note-about-require).)

### Type override
To override the type interpretation, include `;` + optional `.` + an alternate extension at end of URL. The following example forces a `.js` file to be read as if it had been a `.snippets` file:
```js
var mySnippets; // receives array of string from my-notes.js split by getSmart.snip ("\n// ---snip---\n")
getSmart('my-notes.js;snippets', function(array) { mySnippets = array; });
```

### URL hash
In place of a URL, you can give a hash of URLs. The callback, delayed until all files have been received, is passed a new hash with the same keys, with the file data as their respective values, interpreted as above, including [type overrides](#type=override).

The following example reads all five files and once the last one is received, it calls the callback with the results:
```js
getSmart({
    myApi: 'my-api.js',
    myStyleEl: 'my-stylesheet.css',
    myObjec: 'my-data.json',
    mySnippets: 'my-notes.snippets',
    myText: 'my-story.txt'
}, function(results) {
    // results is an object with same keys as above
});
```

## Requring a file (or files) on page load
```js
window.onload = getSmart.bind(null, urlOrUrlHash, function(results) {
   // page logic goes here
});
```

## File specifications
Filenames with no extension default to `.js`.

Omitted filenames default to `index.js`. Omission is detected when path ends in `.`, `..`, or `/`.

Keep in mind that each file specification is a URL which always refers to a file and never an npm module (subfolder in `node_modules`) even though a `./` prefix is not required (on relative URLs). For clarity on this point, consider prepending an innocuous `./` to relative URLs.

## A note about `require`
The only reason synchronous `require` is not supported is that synchronous `XMLHttpRequest` has been deprecated.

The supported `require` is actually the _asynchronous_ `getSmart` function, requiring a callback function in 2nd parameter (see above)

There is one important requirement in modules that use `require`: **A single assignment must be made to `module.exports`.** This assignment triggers the callback. It must be present — even if merely `module.exports = exports`. _This is only necessary in modules that use `require`; in modules that do not use `require`, no such assignment is required._

In the current implementation, relative URLs are relative to the site root and not to the location of the file containing the `require` call.

## Revivers
Additional filetypes can be defined by the application developer by adding functions to the `getSmart.revivers` hash.

Revivers are called with the file `data` in the 1st parameter and the `callback` function in the 2nd parameter.

Synchronous revivers ignore the callback and simply return the revived object.

Asynchronous revivers call the callback with the revived object and return nothing.

## Version History
* `1.1.0` (10/30/2018)
  * `.js` is now the default extension for filenames with no extension
  * `index.js` is now the default filename when no filename is given in the URL (if path ends in `.`, `..`, or `/`)
  * An asynchronous implementation of `require` is now available for use inside `.js` modules
  * `getSmart.revivers` is a dictionary of file processors which the application developer can augment or override
* `1.0.4` (10/9/2018)
  * Update build.sh to create `umd` folder for `unpkg.com` CDN support for this and all future versions. See revised installation snippet above. (`get-smart.github.io` will no longer be updated with new versions, although version `1.0.2` will remain there.)
* `1.0.3` (10/9/2018)
   * Avoid using `Object.assign` for IE-11 compatibility
* `1.0.2` (9/22/2018)
   * Initial release
