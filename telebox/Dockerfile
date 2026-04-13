FROM debian:12-slim

# 安装依赖
RUN apt-get update && apt-get install -y \
    curl git build-essential ca-certificates sudo \
    && update-ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm i -g pm2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /root

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME ["/root/telebox"]

ENTRYPOINT ["/entrypoint.sh"]
