# 代码片段

## Docker 常用命令

```bash
# 查看运行中的容器
docker ps

# 进入容器
docker exec -it <container_name> bash

# 查看日志
docker logs -f <container_name>
```

## Nginx 反代配置

```nginx
server {
    listen 80;
    server_name wiki.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
