(function(){
'use strict';

function getSmart(urlStrOrHash, callback) {
    if (typeof urlStrOrHash === 'object') {
        getSmart.all(urlStrOrHash, callback)
    } else {
        getSmart.ajax(urlStrOrHash, callback);
    }
}

Object.assign(getSmart, {

    ajax: function(url, callback) {
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
                    actualExt = match && match[getSmart.actualExtMatchIndex];

                try {
                    switch ((forcedExt || actualExt || '').toLowerCase()) {
                        case 'json':
                            data = JSON.parse(data);
                            break;
                        case 'css':
                            var el = document.createElement('style');
                            el.innerText = data;
                            data = el;
                            break;
                        case 'snippets':
                            data = data.split(getSmart.snip);
                            break;
                        case 'js':
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
            getSmart.ajax(urlHash[key], function(data) {
                map[key] = data;
                if (!--countdown) {
                    finish(map);
                }
            });
        });
    },

    snip: '\n// --- snip ---\n',

    regexMatchActualFilename: /(.*);.*/,
    regexForcedExtOrActualExt: /((;\.?(\w+))|(\.(\w+)))$/i,
    forcedExtMatchIndex: 3,
    actualExtMatchIndex: 5,

    version: '1.0.2'

});

window.getSmart = getSmart;
})();
