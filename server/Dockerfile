FROM node:alpine

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install

COPY ./ ./

RUN export NODE_OPTIONS=-openssl-legacy-provider

CMD ["npm", "start"]
