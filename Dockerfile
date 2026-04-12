FROM node:20-alpine

WORKDIR /app

COPY iMD-server/package*.json ./server/
RUN cd server && npm install --production

COPY iMD-server/ ./server/
COPY iMD-web/dist/ ./server/public/

WORKDIR /app/server

EXPOSE 4000
CMD ["node", "server.js"]
