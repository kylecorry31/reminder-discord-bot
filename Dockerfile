FROM node:14.17.6-alpine3.14

LABEL org.opencontainers.image.title="Reminder Bot"

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install

ENTRYPOINT [ "node", "index.js" ]