#!/bin/bash
set -e

# 首次运行：my_session 为空，需要交互登录
if [ -z "$(ls -A /app/my_session 2>/dev/null)" ]; then
    echo "==== 首次启动，请完成 Telegram 登录，成功后按 Ctrl+C ===="
    cd /app && npm start || true
fi

exec pm2-runtime /app/ecosystem.config.js
