# run from master branch!
# assumes gh-pages branch already exists

npm run build

VER=$(cat package.json | sed -En 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/p')
mkdir $VER
mkdir $VER/build
mv build/*.js $VER/build

git checkout gh-pages
git add $VER
git status
git commit -am $VER

git push origin gh-pages

git checkout master
