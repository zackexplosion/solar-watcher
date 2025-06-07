#!/bin/bash
# change to your server ip
REMOTE_IP_ADDRESS=0.0.0.0
# change to your remote path to deploy app
REMOTE_PATH=/app/solar-watcher
# change to your app name
APP_NAME=solar-watcher
DEPLOY_FILE_NAME=deploy.tar
NODE_VERSION=14.17.3

npm run build
tar --exclude='node_modules' --exclude='.git' -zcvf $DEPLOY_FILE_NAME  .
echo 'uploading package...'
scp $DEPLOY_FILE_NAME $REMOTE_IP_ADDRESS:~
ssh $REMOTE_IP_ADDRESS "mv $DEPLOY_FILE_NAME $REMOTE_PATH"
ssh $REMOTE_IP_ADDRESS "cd $REMOTE_PATH && tar zxvf $DEPLOY_FILE_NAME"
echo 'installing package..'
ssh $REMOTE_IP_ADDRESS "cd $REMOTE_PATH && npm install --production"
ssh $REMOTE_IP_ADDRESS "nvm use $NODE_VERSION && pm2 restart $REMOTE_PATH/ecosystem.config.js --env production"
# ssh $REMOTE_IP_ADDRESS "nvm $NODE_VERSION && pm2 restart --name $APP_NAME $REMOTE_PATH/server/index.js"
# ssh $REMOTE_IP_ADDRESS "cd ${REMOTE_PATH} && npm install"
ssh $REMOTE_IP_ADDRESS "cd $REMOTE_PATH && rm $DEPLOY_FILE_NAME"
rm $DEPLOY_FILE_NAME
