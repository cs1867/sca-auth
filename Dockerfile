FROM node:14

RUN npm install http-server -g && \
    npm install pm2 -g && \
    pm2 install pm2-logrotate

COPY . /app
RUN cd /app && npm install --production
RUN cd /app/ui && npm install --production

EXPOSE 80
EXPOSE 8080

CMD [ "/app/docker/start.sh" ]

