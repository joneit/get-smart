# get-smart
AJAX function to smartly GET .js modules, .json objects, .css stylesheets, and .snippets array; else raw text

This function performs a basic asynchronous [**AJAX**](https://en.wikipedia.org/wiki/Ajax_(programming)) call that interprets results based solely on the filename extensions listed above; unlisted extensions (including no extension) returns the raw text contents of the file. MIME type is always ignored.

## Access

```js
var getSmart = require('get-smart');
```

As an alternative to using the npm module, the author maintains versioned CDN files that sets the global `getSmart`. The client would request one of the following (where `1.0.0` is the requested version):
```html
<script src="https://joneit.github.io/get-smart/1.0.0/build/get-smart.js"></script>
<script src="https://joneit.github.io/get-smart/1.0.0/build/get-smart.min.js"></script>
```

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
The closure has access to locals `exports` and `module`.
(`require` is not supported; see [note below](#a-note-about-require).)

### Type override
To override the type interpretation, include `;` + optional `.` + an alternate extension at end of URL. The following example forces a `.js` file to be read as if it had been a `.snippets` file:
```js
var mySnippets; // receives array of string from my-notes.js split by getSmart.snip ("\n// ---snip---\n")
getSmart('my-notes.js;snippets', function(array) { mySnippets = array; });
```

### URL hash
In place of a URL, you can give a hash of URLs. The callback, delayed until all files have been received, is passed a new hash with the same keys, with the file data as their values, interpretted as above, including [type overrides](#type=override).

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

## A note about `require`
The only reason `require` is not supported in general, and in `.js` modules in particular, is that synchronous `XMLHttpRequest` has been deprecated (except in Web Workers). Maybe later!
