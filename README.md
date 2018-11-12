# get-smart
<sup>AJAX function to smartly GET .js modules, .json objects, .css stylesheets, and .snippets array; else raw text</sup>

This function performs a basic asynchronous [**AJAX**](https://en.wikipedia.org/wiki/Ajax_(programming)) call that interprets results based solely on the filename extensions listed above; unlisted extensions (including no extension) returns the raw text contents of the file. MIME type is always ignored.

## Access

```js
var getSmart = require('get-smart');
```

As an alternative to using the npm module, the client may request a versioned build file that sets the global `window.getSmart`:
```html
<script src="https://unpkg.com/get-smart@2.0/umd/get-smart.js"></script>
<script src="https://unpkg.com/get-smart@2.0/umd/get-smart.min.js"></script>
```
Any [SEMVER](//semver.org) string can be used. `2.0` in the above means load the latest of the 2.0.* range. See the [npm semver calculator](//semver.npmjs.com) and npm’s [semantic versioning](https://docs.npmjs.com/misc/semver) page.

## Usage

There are two overloads to the `getSmart` function (shown in TypeScript-like pseudo-code):
* String URL overload: `getSmart(url: string, callback: function, prototype: object)`
* URL hash overload: `getSmart(urls: object, callback: function, prototype: object)`

### String URL

Calling signature: `getSmart(url: string, callback: function, modulePrototype: object = Object)`

This overload gets a single file, "revived" per file extension:

```js
var myApi; // receives the value of `module.exports` set in my-api.js
getSmart('my-api.js', function(api) { myApi = api; }, modulePrototype);

var myStyleEl; // receives a <style> element with innerHTML set to contents of my-stylesheet.css
getSmart('my-stylesheet.css', function(styleEl) { myStyleEl = styleEl; });

var myObject; // receives an object (or array) JSON.parse'd from the contents of my-data.json
getSmart('my-data.json', function(json) { myObject = json; });

var mySnippets; // receives array of string from my-notes.snippets split by getSmart.snip ("\n// ---snip---\n")
getSmart('my-notes.snippets', function(array) { mySnippets = array; });

var myText; // receives contents of my-story.txt entirely as raw text (any other extension or null extension)
getSmart('my-story.txt', function(text) { myText = text; });
```

### URL hash

Calling signature: `getSmart(urls: object, callback: function, modulePrototype: object = Object)`

This overload gets a set of files and waits till they’re all ready. That is, the callback is delayed until all files have been received. It is passed a new hash with the shape (same keys), with the "revived" file data as values.

The following example reads all five files and once the last one is received, it calls the callback with the results:
```js
getSmart({
    myApi: 'my-api.js',
    myStyleEl: 'my-stylesheet.css',
    myObject: 'my-data.json',
    mySnippets: 'my-notes.snippets',
    myText: 'my-story.txt'
}, function(results) {
    // results is an object with same keys as above
});
```

## Requiring a file (or files) on page load
```js
window.onload = getSmart.bind(null, urlOrUrlHash, function(results) {
   // page logic goes here and typically references results
});
```

### File revivers

Files are "revived" per their extension:

Extension | File Type | Returned Value
--------- | :-------: | --------------
`.js` | JavaScript | Any value as returned by the executed JavaScript code in the file via `exports` or `module.exports` per CommonJS usage
`.css` | CSS Stylesheet | A `HTMLStyleElement` (`<style>...</style>` element)
`.json` | JSON | A plain JavaScript object as returned by `JSON.parse`
`.snippets` | Snippets | An `Array` of strings split by `getSmart.snip`
`.txt` | Generic | Raw data (any extension or null extension)

#### JavaScript
Each file is fetched, closed over, and executed. The closure has access to locals `exports`, `module`, and `require`. This `require` is _asynchronous_ and takes a callback. See [note below](#a-note-about-require).

The JavaScript reviver respects the optional third parameter to `getSmart` called `modulePrototype`, an optional object which becomes the prototype for the local `module` object. This gives the module access to selected globals. In any case, `module.exports` is always a defined on the instance. (If not included in the call, `module`’s prototype is `Object`.)

#### Snippets
Snippets files contain sections of text separated by the string in `getSmart.snip`. The return value is an array of these sections. If the separator does not appear in the file, a single-element array is returned.

#### Overriding which reviver is called
To override the reviver, append the following to the filename: `;substring.reviver` where:
* `substring` — Can be any string and is ignored if present (may be of possible use to applications)
* `.` — Separator (if substring omitted, `.` may also be omitted)
* `reviver` — The name of a reviver

The following example forces a `.js` file to be read as if it had been a `.snippets` file:
```js
var mySnippets; // receives array of string from my-notes.js split by getSmart.snip ("\n// ---snip---\n")
getSmart('my-notes.js;snippets', function(array) { mySnippets = array; });
```

## File specifications
Filenames with no extension default to `.js`.

Omitted filenames default to `index.js`. Omission is detected when path ends in `.`, `..`, or `/`. (Unlike CommonJS, we cannot otherwise discern folders.)

Keep in mind that each file specification is a URL which always refers to a hosted file. It never refers to an npm module in a `node_modules` folder. Although we don’t require a `./` prefix on relative URLs, for clarity on this point consider prepending an (innocuous) `./` to such URLs.

## A note about `require`
The only reason synchronous `require` is not supported is that synchronous `XMLHttpRequest` has been deprecated.

The supported `require` is actually `getSmart.require`, which defaults to `getSmart.fetch`, an asynchronous function requiring a callback in a 2nd parameter (see above).

There is one important requirement in modules that use an asynchronous `require`: **A single assignment must be made to `module.exports`.** This assignment triggers the callback and _must_ be present (even if merely `module.exports = exports`). This assignment is only necessary, however, under the following circumstances:
* The module calls `require`; and
* The `require` function is asynchronous

You can override the default `getSmart.require`:
```js
getSmart.require = myRequireFunction;
```
Where `myRequireFunction` may be either a single-parameter synchronous function or a 2-parameter asynchronous function.  If the override is synchronous, no callback is required in the call.

> NOTE: In the current implementation, relative URLs are relative to the site root and not (as in CommonJS modules) to the location of the file containing the `require` call.

## Custom revivers
Additional file content revivers can be defined by the application developer by adding functions to the `getSmart.revivers` hash. All reviver functions are called with `(data, callback, modulePrototype)`. However, it is up to the function whether or not to call the callback:
* **Synchronous reviver functions** ignore the callback and simply return the revived object
* **Asynchronous reviver functions** call the callback with the revived object and return nothing

## Version
`getSmart.version` contains the current version string.

## Overriding API properties and methods
The following members have all been discussed above.
* **Overrideable members**
   * `require`
   * `revivers`
   * `snip`
* **Non-overrideable members**
   * `fetch`
   * `ajax`
   * `all`
   * `version`

## Instantiating

The `getSmart` function is typically called directly. It is however constructable as an option. Do so when you want to override properties and methods on an instance rather than on the shared API.

The following example demonstrates calling getSmart both as an instance and directly as a function:
```js
var GetSmart = require('get-smart');
var callback = function(snippetArray) { ... };

// Call directly:
GetSmart.snip = '### SNIP ###'; // override snip for direct calls only
GetSmart('foo.snippets', callback); // uses default snip

// Create an instance and call it's `fetch` method:
var getSmart = new GetSmart;
getSmart.snip = '*** SNIP ***'; // override snip for this instance only
getSmart.fetch('foo.snippets', callback); // uses instance '*** SNIP ***'
```
Note that the instance object (`getSmart` in this example) is not a callable function. Usage is to call `getSmart.fetch` (which is what the constructor calls when it’s called with parameters).

Note that `getSmart.fetch` merely redirects the method overloads:
* `fetch(string, function)` overload calls `getSmart.ajax` to fetch a single file
* `fetch(object, function)` overload calls `getSmart.all` to fetch a whole group of files

As an alternative to calling `fetch`, these functions may be called directly.

## Version History
See [releases](https://github.com/joneit/get-smart/releases).
