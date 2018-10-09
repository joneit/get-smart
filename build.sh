# package.json: get value of "name" and "version" properties:
MODULE_NAME=$(cat package.json | sed -En 's/.*"name": "(.*)".*/\1/p')
VERSION=$(cat package.json | sed -En 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p')

# index.js: update the `version` property in the code:
sed -i '' -E 's/[0-9]+\.[0-9]+\.[0-9]+/'${VERSION}'/' index.js

# make `umd` subdirectory and ignore error if already extant
mkdir umd 2>/dev/null

# wrap index.js into umd/module-name.js:
echo '(function(){' > umd/$MODULE_NAME.js
sed -E 's/module.exports = ([A-Za-z_$]+)/window.\1 = \1/' index.js >> umd/$MODULE_NAME.js
echo '})();' >> umd/$MODULE_NAME.js

# minifiy wrapped version into umd/module-name.min.js:
uglifyjs umd/$MODULE_NAME.js -cmo umd/$MODULE_NAME.min.js

# list `umd` subdirectory to console as confirmation:
ls -lahL umd