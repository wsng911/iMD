# iMD

> 一个轻量、私有、可自托管的 Markdown 笔记应用。

![version](https://img.shields.io/badge/version-1.0-purple)
![docker](https://img.shields.io/badge/docker-wsng911%2Fimd-blue)
![platform](https://img.shields.io/badge/platform-amd64%20%7C%20arm64-lightgrey)

---

## ✨ 特色

- **私有部署** — 数据完全存储在自己的服务器，不依赖任何第三方云服务
- **Markdown 编辑** — 基于 CodeMirror + md-editor-v3，支持实时预览、代码高亮、数学公式
- **文件夹管理** — 支持文件夹/文档两级结构，拖拽排序，双击重命名
- **隐私空间** — 独立密码保护的私密文件夹，密码单独设置与验证
- **大纲导航** — 单击文档进入大纲次页，树形结构展示 H1/H2/H3，点击跳转
- **导入导出** — 支持上传 `.md` 单文件或 `.zip` 压缩包批量导入；一键导出全部为 ZIP
- **主题切换** — 内置暗色/亮色主题，支持多种 Accent 颜色
- **字体调节** — 右上角实时调整正文字体大小，编辑/预览同步生效
- **响应式布局** — 左栏可折叠，折叠后右栏全屏，菜单按钮悬浮左上角
- **多终端访问** — JWT 认证，任意设备浏览器均可登录使用

---

## 🚀 快速部署

### Docker（推荐）

```bash
# 拉取镜像（支持 amd64 / arm64）
docker run -d \
  --name imd \
  -p 4000:4000 \
  -v ./data:/app/server/data \
  --restart unless-stopped \
  wsng911/imd:latest
```

访问 `http://服务器IP:4000`，默认账号 `admin` / `123456`，**登录后请立即修改密码**。

### Docker Compose + Nginx

```bash
git clone https://github.com/wsng911/iMD.git
cd iMD
docker compose up -d
```

通过 80 端口访问，nginx 自动反向代理到后端 4000 端口。

---

## 📁 目录结构

```
iMD/
├── iMK-server/          # Node.js 后端（Express）
│   ├── routes/
│   │   ├── auth.js      # 登录、改密码、隐私密码
│   │   ├── docs.js      # 文档 CRUD、导入
│   │   └── settings.js  # 主题/字体设置
│   ├── store.js         # 文件存储（JSON + .md 文件）
│   └── server.js        # 入口，同时 serve 前端静态文件
├── iMK-web/             # Vue 3 前端（Vite）
│   └── src/
│       ├── components/
│       │   ├── Sidebar.vue   # 左栏：文件树、大纲次页、隐私空间
│       │   ├── Viewer.vue    # Markdown 预览
│       │   └── Editor.vue    # Markdown 编辑器
│       └── pages/
│           └── Layout.vue    # 主布局
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

---

## 🔧 本地开发

```bash
# 后端
cd iMK-server && npm install && node server.js

# 前端（另开终端）
cd iMK-web && npm install && npm run dev
```

前端默认代理到 `http://localhost:4000`，在 `vite.config.js` 中配置 `VITE_API_URL`。

---

## 🔒 安全说明

- 登录基于 JWT，Token 有效期 7 天
- 隐私空间密码独立于登录密码，bcrypt 加密存储
- 建议生产环境通过环境变量设置 `JWT_SECRET`：
  ```bash
  docker run -e JWT_SECRET=your_secret_key ...
  ```

---

## 📦 数据备份

所有数据存储在 `data/` 目录：

```
data/
├── docs.json      # 文档结构（文件夹/文档元数据）
├── user.json      # 用户账号
├── settings.json  # 主题/字体设置
├── private.json   # 隐私空间密码
└── md/            # 文档内容（每篇文档一个 .md 文件）
```

备份只需打包 `data/` 目录即可。

---

## License

MIT
