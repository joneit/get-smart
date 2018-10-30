'use strict';

function getSmart(urlStrOrHash, callback) {
    if (typeof urlStrOrHash === 'object') {
        getSmart.all(urlStrOrHash, callback)
    } else {
        getSmart.ajax(urlStrOrHash, callback);
    }
}

getSmart.revivers = {
    json: function(data) { // : Object from JSON via JSON.parse
        return JSON.parse(data);
    },
    css: function(data) { // : HTMLStyleElement
        var el = document.createElement('style');
        el.innerText = data;
        return el;
    },
    snippets: function(data) { // : Array of string
        return data.split(getSmart.snip);
    },
    js: function(data, callback) { // : Object from code via Function constructor
        var calledBack, nestedCallback,
            exports = {},
            module = {
                get exports() {
                    return exports;
                },
                set exports(exports) {
                    calledBack = true;
                    callback(exports);
                }
            },
            closure = new Function('module', 'exports', 'require', data),
            require = function() {
                nestedCallback = true;
                getSmart.apply(getSmart, arguments);
            };

        closure(module, exports, require);

        if (!nestedCallback && !calledBack) {
            callback(module.exports);
        }
    }
};

getSmart.ajax = function(url, callback) {
    if (typeof callback !== 'function') {
        throw new TypeError('callback is not a function (get-smart is asynchronous and requires a callback in a 2nd parameter)')
    }

    url = applyDefaults(url);

    var httpRequest = new XMLHttpRequest(),
        filename = url.replace(getSmart.regexMatchActualFilename, '$1');

    httpRequest.open('GET', filename, true);

    httpRequest.onreadystatechange = function() {
        if (
            httpRequest.readyState === 4 && // HTTP_STATE_DONE
            httpRequest.status === 200 // HTTP_STATUS_OK
        ) {
            var data = httpRequest.responseText,
                match = url.match(getSmart.regexForcedExtOrActualExt),
                forcedExt = match && match[getSmart.forcedExtMatchIndex],
                actualExt = match && match[getSmart.actualExtMatchIndex],
                reviver = getSmart.revivers[(forcedExt || actualExt).toLowerCase()];

            if (reviver) {
                try {
                    data = reviver(data, callback);
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
};

getSmart.all = function(urlHash, finish) {
    var keys = Object.keys(urlHash);
    var countdown = keys.length;
    var map = {};
    keys.forEach(function (key) {
        getSmart.ajax(urlHash[key], function(data) {
            map[key] = data;
            if (!--countdown) {
                finish(map);
            }
        });
    });
};

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
        default: if (filename.indexOf('.') < 0) { filename += '.js'; }
    }
    return url.substring(0, slash) + filename + url.substring(qsOrFragment);
}

getSmart.snip = '\n// --- snip ---\n';

getSmart.regexMatchActualFilename = /(.*);.*/;
getSmart.regexForcedExtOrActualExt = /((;\.?(\w+))|(\.(\w+)))$/i;
getSmart.forcedExtMatchIndex = 3;
getSmart.actualExtMatchIndex = 5;

getSmart.version = '1.1.0';


module.exports = getSmart;
