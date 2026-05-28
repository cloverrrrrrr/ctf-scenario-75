FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
RUN npm install
COPY . .
EXPOSE 3075
CMD [ "npm", "start" ]