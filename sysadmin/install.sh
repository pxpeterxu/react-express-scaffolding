#!/bin/sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

#
# Prompts
#

NODE_SERVER_PORT=''  # SET THIS!
if [[ -z "$NODE_SERVER_PORT" ]]; then
  echo 'Please set NODE_SERVER_PORT in install.sh, then remove this check'
end

MYSQL_ROOT_PASSWORD=''
echo 'Please enter the MySQL root user password'
read -e MYSQL_ROOT_PASSWORD

REDIS_PASSWORD=''
echo 'Please enter the Redis password'
read -e REDIS_PASSWORD

DOMAIN=''
echo 'Please enter the domain to use (PHPMyAdmin will be at thisispma.DOMAIN)'
read -e DOMAIN

cd "$DIR"

# Main server
bash install-scripts/components/nodejs.sh
bash install-scripts/components/yarn.sh
bash install-scripts/components/nginx.sh
bash install-scripts/components/certificates.sh "$DOMAIN" "$NODE_SERVER_PORT"

# MySQL/MariaDB
bash install-scripts/components/mariadb.sh "$MYSQL_ROOT_PASSWORD"
sed -i 's/(bind-address\s*=\s*)127.0.0.1/\10.0.0.0/' /etc/mysql/my.cnf
systemctl restart mariadb

# Setup phpMyAdmin
bash install-scripts/components/phpmyadmin.sh
mv -f /etc/nginx/sites-available/phpmyadmin /etc/nginx/sites-available/phpmyadmin-ssl
cp -f install-scripts/nginx/initial-single /etc/nginx/sites-available/phpmyadmin
systemctl reload nginx
bash install-scripts/components/letsencrypt.sh "thisispma.$DOMAIN"
mv -f /etc/nginx/sites-available/phpmyadmin-ssl /etc/nginx/sites-available/phpmyadmin
sed -i "s/thisispma\.DOMAIN\.com/thisispma.$DOMAIN/g" /etc/nginx/sites-available/phpmyadmin
systemctl reload nginx

# Others
bash install-scripts/components/logrotate.sh
bash install-scripts/components/redis.sh "$REDIS_PASSWORD"

# Main app
bash components/app-build.sh
bash components/app-start.sh
