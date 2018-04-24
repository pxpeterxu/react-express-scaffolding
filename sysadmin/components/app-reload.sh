#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Even though we don't need to be in the right directory in theory,
# in practice, being in the wrong directly could lead to permissions
# issues
cd "$DIR/../.."

su -c 'NODE_ENV=production DATABASE=production pm2 reload www' web
