NAME=getSmart

MODNAM=$(cat package.json | sed -En 's/.*"name": "(.*)".*/\1/p')

mkdir build 2>/dev/null

echo '(function(){' > build/$MODNAM.js
sed 's/module.exports =/window.'$NAME' =/' index.js >> build/$MODNAM.js
echo '})();' >> build/$MODNAM.js

uglifyjs build/$MODNAM.js -cmo build/$MODNAM.min.js

ls -lahL build