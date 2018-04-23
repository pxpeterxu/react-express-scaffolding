#
# Before using this file, make sure you fill in:
# - YOUR_REPOSITORY
#

cat > preinstall.sh <<'END'
#!/bin/sh

#
# This script should be downloaded and run before running all
# other install scripts
#

if [ ! -f ~/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -N '' -f ~/.ssh/id_rsa
fi

KEY_ADDED=""
while [ "$KEY_ADDED" != "y" ]; do
  cat ~/.ssh/id_rsa.pub
  echo ''
  echo 'Please add the above key to GitLab as a deployment key'
  echo 'for both this project and install-scripts'
  echo 'so that this server can pull the code, and then enter y'
  read -e KEY_ADDED
done

# Set up user and /home/web directory
NODE_WEB_PASS=$(</dev/urandom tr -dc 'A-Za-z0-9!"#$%&'\''()*+,-./:;<=>?@[\]^_`{|}~' | head -c 32 ; echo)
useradd --home /home/web --shell /bin/bash --create-home web
echo "web:$NODE_WEB_PASS" | chpasswd

# Clone the code
apt-get install -y git
cd /home/web
git clone git@gitlab.com:myrtlelime/YOUR_REPOSITORY.git app
cd app/sysadmin
git clone git@gitlab.com:myrtlelime/install-scripts.git
END
