#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd /home/web/app
yarn install

mkdir -p dist/app/logs dist/app/temp
chown -R web:web dist/app/logs dist/app/temp

NODE_ENV=production DATABASE=production gulp build-client
NODE_ENV=production DATABASE=production gulp build-server
chmod +x dist/app/server/bin/www.js

su -c 'pm2 update' web
su -c 'NODE_ENV=production DATABASE=production pm2 start -i 0 /home/web/app/dist/app/server/bin/www.js' web
su -c 'pm2 save' web
