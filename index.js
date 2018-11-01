/* eslint-env browser */

'use strict';

var regexRemoveForcedExt = /(.*);.*/;
var regexForcedExtOrActualExt = /(\.([^./?#;]+))?([?#].*?)?(;([^.]+\.([^.]+)|\.?([^.]+)))?$/;
var forcedExtMatchIndexes = [6, 7];
var actualExtMatchIndexes = [2];
var regexHasModuleExports = /module\s*\.\s*exports\s*=[^=]/; // highly imperfect but better than nothing


function getSmart(urlStrOrHash, callback, modulePrototype) {
    if (arguments.length) {
        var context = this || getSmart.prototype;
        context.fetch.apply(context, arguments);
    }
}

var revivers = {
    json: function(data) { // : Object from JSON via JSON.parse
        return JSON.parse(data);
    },
    css: function(data) { // : HTMLStyleElement
        var el = document.createElement('style');
        el.innerText = data;
        return el;
    },
    snippets: function(data) { // : Array of string
        return data.split(this.snip);
    },
    js: function(javascript, callback, modulePrototype) { // : Object from code via Function constructor
        var calledBack, nestedCallback,
            exports = {},
            module = Object.create(modulePrototype || Object, { exports: {
                get: function() { return exports; },
                set: function(newExports) {
                    exports = newExports;
                    if (nestedCallback) {
                        if (calledBack) {
                            throw new Error('Modules calling require() may not have multiple module.exports assignments');
                        }
                        calledBack = true;
                        callback(exports);
                    }
                }
            }}),
            closure = new Function('module', 'exports', 'require', javascript), // eslint-disable-line no-new-func
            context = this,
            require = function() {
                if (!regexHasModuleExports.test(javascript)) {
                    throw new Error('Modules calling require() must have a module.exports assignment');
                }
                nestedCallback = true;
                context.require.apply(context, arguments);
            };

        closure(module, exports, require);

        if (!nestedCallback && !calledBack) {
            callback(module.exports);
        }
    }
};

var descriptors = {
    // non-overrideable members
    fetch: { enumerable: true, configurable: false, value: fetch },
    ajax: { enumerable: true, configurable: false, value: ajax },
    all: { enumerable: true, configurable: false, value: all },
    version: { enumerable: true, configurable: false, value: '2.0.0' },

    // overrideable members
    require: { enumerable: true, configurable: true, value: fetch },
    revivers: { enumerable: true, configurable: true, value: revivers },
    snip: { enumerable: true, configurable: true, value: '\n// --- snip ---\n' }
};

Object.defineProperties(getSmart, descriptors);
Object.defineProperties(getSmart.prototype, descriptors);

function fetch(urlStrOrHash, callback, modulePrototype) {
    this[typeof urlStrOrHash === 'object' ? 'all' : 'ajax'].apply(this, arguments);
}

function ajax(url, callback, modulePrototype) {
    if (typeof callback !== 'function') {
        throw new TypeError('Expected callback to be a function');
    }

    url = applyDefaults(url);

    var context = this,
        httpRequest = new XMLHttpRequest(),
        filename = url.replace(regexRemoveForcedExt, '$1');

    httpRequest.open('GET', filename, true);

    httpRequest.onreadystatechange = function() {
        if (
            httpRequest.readyState === 4 && // HTTP_STATE_DONE
            httpRequest.status === 200 // HTTP_STATUS_OK
        ) {
            var data = httpRequest.responseText,
                match = url.match(regexForcedExtOrActualExt),
                forcedExt = matchAny(match, forcedExtMatchIndexes),
                actualExt = matchAny(match, actualExtMatchIndexes),
                reviverKey = (forcedExt || actualExt).toLowerCase(),
                reviver = context.revivers[reviverKey];

            if (reviver) {
                try {
                    data = reviver.call(context, data, callback, modulePrototype);
                } catch (err) {
                    console.warn(err);
                }
            }

            if (!reviver || reviver.length === 1) {
                callback(data);
            }
        }
    };

    httpRequest.send(null);
}

function all(urlHash, finish, modulePrototype) {
    var keys = Object.keys(urlHash);
    var countdown = keys.length;
    var map = {};
    keys.forEach(function(key) {
        function cb(data) {
            map[key] = data;
            if (!--countdown) {
                finish(map);
            }
        }
        this.ajax(urlHash[key], cb, modulePrototype);
    }, this);
}

function matchAny(match, indexes) {
    return match && indexes.reduce(function(result, index) { return result || match[index]; }, '') || '';
}

function applyDefaults(url) {
    var slash = url.lastIndexOf('/');
    slash = slash < 0 ? 0 : slash + 1;
    var qsOrFragment = url.indexOf('?', slash);
    if (qsOrFragment < 0) { qsOrFragment = url.indexOf('#', slash); }
    if (qsOrFragment < 0) { qsOrFragment = url.length; }
    var filename = url.substring(slash, qsOrFragment);
    switch (filename) {
        case '.':
        case '..': filename += '/index.js'; break;
        case '': filename += 'index.js'; break;
        default:
            var i = filename.indexOf('.');
            if (i < 0) {
                filename += '.js';
            } else if (i === filename.length - 1) {
                filename = filename.substr(0, i);
            }
    }
    return url.substring(0, slash) + filename + url.substring(qsOrFragment);
}


module.exports = getSmart;
