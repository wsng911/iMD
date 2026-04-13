#!/bin/bash
set -e

APP_DIR="/root/telebox"

# 如果 TeleBox 未安装，则克隆并安装
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "==== 首次启动，正在克隆 TeleBox ===="
    git clone https://github.com/TeleBoxDev/TeleBox.git "$APP_DIR"
    cd "$APP_DIR"
    npm install --prefer-offline --no-audit

    # 创建 PM2 ecosystem 配置
    cat > "$APP_DIR/ecosystem.config.js" <<'EOF'
module.exports = {
  apps: [{
    name: "telebox",
    script: "npm",
    args: "start",
    cwd: __dirname,
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    merge_logs: true,
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",
    restart_delay: 4000,
    env: { NODE_ENV: "production" }
  }]
}
EOF
    mkdir -p "$APP_DIR/logs"

    echo "==== 请完成 Telegram 首次登录，登录成功后按 Ctrl+C ===="
    cd "$APP_DIR" && npm start || true
fi

# 后台运行
cd "$APP_DIR"
exec pm2-runtime ecosystem.config.js
