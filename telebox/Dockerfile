FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git ca-certificates \
    && npm i -g pm2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /root

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
