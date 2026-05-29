FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY . .
EXPOSE 3075
CMD [ "npm", "start" ]