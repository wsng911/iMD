#!/bin/bash
set -e

docker compose pull
docker compose up -d --remove-orphans

echo "✅ iMK 已启动：http://$(curl -s ifconfig.me):8080"
