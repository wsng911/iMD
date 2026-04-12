FROM node:20-alpine

WORKDIR /app

# 后端依赖
COPY iMK-server/package*.json ./server/
RUN cd server && npm install --production

# 后端代码
COPY iMK-server/ ./server/

# 前端 dist（已预先 build）
COPY iMK-web/dist/ ./server/public/

# 后端 serve 前端静态文件
RUN sed -i 's|app.use(express.json())|app.use(express.json())\napp.use(require("express").static(__dirname + "/public"))|' ./server/server.js

WORKDIR /app/server

EXPOSE 3000

CMD ["node", "server.js"]
