#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$DIR/../.."

git fetch && git reset --hard origin/master
yarn install

mkdir -p dist/app/logs dist/app/temp
chown -R web:web dist/app/logs dist/app/temp

NODE_ENV=production DATABASE=production gulp build-client
NODE_ENV=production DATABASE=production gulp build-server
chmod +x dist/app/server/bin/www.js
