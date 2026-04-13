FROM node:20-slim

RUN apt-get update && apt-get install -y git ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 克隆并安装 TeleBox
RUN git clone https://github.com/TeleBoxDev/TeleBox.git /app \
    && cd /app && npm install --prefer-offline --no-audit

# 安装 PM2
RUN npm i -g pm2

WORKDIR /app

COPY ecosystem.config.js .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
