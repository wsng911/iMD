#!/bin/bash
set -e

# 判断 config.json 是否已有 session
if [ ! -f /app/config.json ] || ! grep -q '"session"' /app/config.json 2>/dev/null; then
    echo "==== 首次启动，请完成 Telegram 登录，成功后按 Ctrl+C ===="
    cd /app && npm start || true
fi

exec pm2-runtime /app/ecosystem.config.js
