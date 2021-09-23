FROM node:current-alpine

LABEL org.opencontainers.image.title="Reminder Bot"

RUN mkdir -p /usr/src/app

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install

ENTRYPOINT [ "node", "index.js" ]