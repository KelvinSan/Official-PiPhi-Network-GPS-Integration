FROM node:22-slim

RUN mkdir /piphi-integration

COPY . /piphi-integration

WORKDIR /piphi-integration

RUN npm install

EXPOSE 3080

CMD ["npm", "start"]