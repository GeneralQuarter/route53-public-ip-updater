FROM node:16-alpine

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY ./dist ./dist

ENTRYPOINT [ "npm", "run", "start" ]