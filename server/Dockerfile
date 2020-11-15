FROM node:alpine

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "start"]
