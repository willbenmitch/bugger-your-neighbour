FROM node:alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY ./ ./

RUN ls

CMD ["npm", "start"]
