#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Even though we don't need to be in the right directory in theory,
# in practice, being in the wrong directly could lead to permissions
# issues
cd "$DIR/../.."

su -c 'pm2 update' web
su -c 'NODE_ENV=production DATABASE=production pm2 start -i 0 /home/web/app/dist/app/server/bin/www.js' web
su -c 'pm2 save' web
