FROM node:18-alpine
WORKDIR /usr/src/app
COPY . .
EXPOSE 3075
CMD [ "node", "server.js" ]