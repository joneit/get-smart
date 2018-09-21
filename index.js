'use strict';

function getMod(urlStrOrHash, callback) {
    if (typeof urlStrOrHash === 'object') {
        getMod.all(urlStrOrHash, callback)
    } else {
        getMod.ajax(urlStrOrHash, callback);
    }
}

Object.assign(getMod, {

    ajax: function(url, callback) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open('GET', url, true);
        httpRequest.onreadystatechange = function() {
            if (
                httpRequest.readyState === 4 && // HTTP_STATE_DONE
                httpRequest.status === 200 // HTTP_STATUS_OK
            ) {
                var data = httpRequest.responseText,
                    match = url.match(/\.\w+$/);
                try {
                    switch (match && match[0]) {
                        case '.json':
                            data = JSON.parse(data);
                            break;
                        case '.css':
                            var el = document.createElement('style');
                            el.innerText = data;
                            data = el;
                        case '.snippets':
                            data = data.split(getMod.snip);
                            break;
                        case '.js':
                            try {
                                var exports = {},
                                    module = {exports: exports},
                                    closure = new Function('module', 'exports', data);
                                closure(module, exports);
                                data = module.exports;
                            } catch (err) {
                                console.warn(err);
                            }
                            break;
                    }
                } catch (err) {
                    console.warn(err);
                }
                callback(data);
            }
        };
        httpRequest.send(null);
    },

    all: function(urlHash, finish) {
        var keys = Object.keys(urlHash);
        var countdown = keys.length;
        var map = {};
        keys.forEach(function (key) {
            getMod.ajax(urlHash[key], function(data) {
                map[key] = data;
                if (!--countdown) {
                    finish(map);
                }
            });
        });
    },

    snip: '\n// --- snip ---\n'

});

module.exports = getMod;
