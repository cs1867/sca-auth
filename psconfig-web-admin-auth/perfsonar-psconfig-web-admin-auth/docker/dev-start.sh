#!/bin/bash

#This script is used inside the docker container to start api and ui(via http-server)

#if [ ! -f /app/api/config/auth.key ]; then
#    (
#    echo "generating auth.key/.pub"
#    cd /app/api/config
#    openssl genrsa -out auth.key 2048
#    chmod 600 auth.key
#    openssl rsa -in auth.key -pubout > auth.pub
#
#    echo "generating user.jwt"
#    node /app/bin/auth.js issue --scopes '{"common":["user"]}' --sub sca --out user.jwt
#    chmod 600 user.jwt
#    )
#fi
#
echo "starting auth api"
pm2 start /app/api/auth.js

echo "starting http-server for ui"
#http-server -p 80 -a 0.0.0.0 /app/ui
pm2 start node_modules/http-server/bin/http-server --name auth-ui -- -p 8081 -a localhost -d false /home/mj82/src/sca-auth/ui

pm2 logs
