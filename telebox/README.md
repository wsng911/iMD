# TeleBox Docker 镜像

基于 `debian:12-slim`，支持 amd64 / arm64，预装 Node.js 20 + PM2。

## 构建镜像

```bash
# 本地构建
docker build -t telebox .

# 多平台构建（需要 buildx）
docker buildx build --platform linux/amd64,linux/arm64 -t yourname/telebox:latest --push .
```

## 首次运行（交互式登录）

```bash
docker run -it --name telebox \
  -v ./data:/root/telebox \
  --restart unless-stopped \
  telebox
```

按提示完成 Telegram 账号登录，看到连接成功后按 `Ctrl+C`。  
之后容器会自动以 PM2 后台模式重启。

## 后续管理

```bash
# 查看日志
docker logs -f telebox

# 进入容器
docker exec -it telebox bash

# 重启
docker restart telebox
```

## 使用 Docker Compose

```bash
# 首次（交互登录）
docker compose run --rm telebox

# 后台运行
docker compose up -d
```

## 数据目录

所有 TeleBox 数据持久化在 `./data`（宿主机），对应容器内 `/root/telebox`。
