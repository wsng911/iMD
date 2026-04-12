FROM node:20-alpine

WORKDIR /app

COPY iMK-server/package*.json ./server/
RUN cd server && npm install --production

COPY iMK-server/ ./server/
COPY iMK-web/dist/ ./server/public/

WORKDIR /app/server

EXPOSE 4000
CMD ["node", "server.js"]
