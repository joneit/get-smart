require('submodule', function(b) {
    module.log('return: ' + b);
    module.log('parse: module');
    module.exports = function(b) { module.log('return: ' + b); };
}, module);
