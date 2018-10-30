require('submodule', function(b) {
    console.log(b);
    console.log('parse');
    module.exports = function() { console.log('exec'); };
});
