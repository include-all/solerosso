# 部署指南

## 快速开始

### 1. 配置部署信息

编辑 `.env.deploy`：

```bash
SERVER_HOST=root@[服务器IP]
REMOTE_DIR=/opt/solerosso
```

### 2. 服务器初始化（首次）

```bash
# SSH 到服务器
ssh root@[服务器IP]

# 配置 Docker 镜像源
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF

# 重启 Docker
systemctl daemon-reload
systemctl restart docker

# 安装 docker-compose（如果没有）
# Docker 20+ 已内置 docker compose 命令
```

### 3. 部署应用

```bash
# 本地执行
./deploy-docker.sh

# 配置 Nginx
scp nginx.conf root@[服务器IP]:/etc/nginx/conf.d/solerosso.conf
ssh root@[服务器IP] "nginx -t && systemctl reload nginx"
```

### 4. 访问

- 前端：http://[服务器IP]
- API：http://[服务器IP]/api

---

## 常用命令

### 构建与部署

```bash
# 完整部署（上传 + 构建 + 启动）
./deploy-docker.sh

# 仅构建某个服务
docker compose build api
docker compose build web

# 强制重建（不用缓存）
docker compose build --no-cache api

# 启动/停止
docker compose up -d
docker compose down
docker compose restart api
```

### 日志查看

```bash
# 查看容器状态
docker ps -a

# 查看日志
docker logs solerosso-api --tail 100 -f
docker logs solerosso-web --tail 100 -f

# 查看构建日志
docker compose build api 2>&1 | tee build.log
```

### 调试

```bash
# 进入容器
docker exec -it solerosso-api sh
docker exec -it solerosso-web sh

# 检查文件
docker exec solerosso-api ls -la /app/dist/src/

# 手动运行构建
docker run --rm -v $(pwd)/packages/api:/app -w /app node:20-slim npm run build
```

### 数据库

```bash
# 连接数据库
docker exec -it pg17 psql -U postgres -d solerosso

# 备份
docker exec pg17 pg_dump -U postgres solerosso > backup.sql

# 恢复
cat backup.sql | docker exec -i pg17 psql -U postgres -d solerosso
```

---

## 镜像源配置详解

### 问题背景

国内服务器访问 Docker Hub、npm、apt 官方源经常超时，需要配置国内镜像加速。

### Docker 镜像源

**配置文件位置**：`/etc/docker/daemon.json`

**推荐配置**：
```json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
```

**镜像源状态**（2024年验证）：
| 镜像源 | 状态 | 说明 |
|--------|------|------|
| docker.1ms.run | 可用 | 推荐，稳定 |
| docker.xuanyuan.me | 可用 | 备选 |
| m.daocloud.io | 部分可用 | 部分镜像返回 403 |
| docker.mirrors.ustc.edu.cn | 不可用 | DNS 解析失败 |
| registry.docker-cn.com | 不可用 | 已关闭 |

**重启 Docker 生效**：
```bash
systemctl daemon-reload
systemctl restart docker
```

### npm 源

**Dockerfile 中配置**：
```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

**本地开发配置**：
```bash
npm config set registry https://registry.npmmirror.com
```

**验证**：
```bash
npm config get registry
# 应输出: https://registry.npmmirror.com
```

### apt 源（Debian/Ubuntu）

**Dockerfile 中配置**：
```dockerfile
# 替换默认源为阿里云
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

# 然后正常安装
RUN apt-get update && apt-get install -y openssl
```

**原理**：
- `node:20-slim` 基于 Debian Bookworm
- 默认源 `deb.debian.org` 在国内访问慢
- 阿里云镜像 `mirrors.aliyun.com` 国内访问快

---

## Nginx 配置

### 配置文件

`nginx.conf` 放在 `/etc/nginx/conf.d/` 目录下：

```nginx
server {
    listen 80;
    server_name _;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 注意事项

1. **使用 127.0.0.1**：nginx 在宿主机运行，不能用 Docker 容器名
2. **WebSocket 支持**：需要配置 `Upgrade` 和 `Connection` 头
3. **API 路径**：`/api/` 代理到后端的 `/api/`，保持路径一致

---

## 故障排查

### API 容器反复重启

```bash
# 查看错误日志
docker logs solerosso-api --tail 50

# 常见原因：
# 1. dist/main.js 不存在 → 重新构建
# 2. 数据库连接失败 → 检查 .env 配置
# 3. 端口被占用 → docker compose down 后重启
```

### Nginx 502 Bad Gateway

```bash
# 检查后端服务是否运行
docker ps | grep api

# 检查 nginx 配置
nginx -t

# 检查端口监听
netstat -tlnp | grep 3001
```

### 构建内存不足 (ENOMEM)

```bash
# 分开构建
docker compose build api && docker compose up -d api
docker compose build web && docker compose up -d web

# 或增加 swap
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Docker 镜像拉取失败

```bash
# 检查镜像源配置
cat /etc/docker/daemon.json

# 测试镜像源
curl https://docker.1ms.run/v2/

# 重启 Docker
systemctl restart docker
```

### npm 安装依赖冲突

```bash
# 使用 --legacy-peer-deps
RUN npm install --legacy-peer-deps
```

---

## 文件结构

```
solerosso/
├── packages/
│   ├── api/              # NestJS 后端
│   │   ├── Dockerfile
│   │   ├── src/
│   │   └── prisma/
│   └── web/              # Next.js 前端
│       ├── Dockerfile
│       └── src/
├── docker-compose.yml    # Docker 编排
├── nginx.conf            # Nginx 配置
├── .env.deploy           # 部署配置（不提交 git）
├── deploy-docker.sh      # 部署脚本
└── docs/                 # 文档
```

---

## 环境变量说明

### .env.deploy（部署配置）

```bash
SERVER_HOST=root@[服务器IP]    # SSH 登录信息
REMOTE_DIR=/opt/solerosso       # 服务器部署目录
```

### packages/api/.env（API 配置）

```bash
DATABASE_URL="postgresql://postgres:密码@[服务器IP]:5432/solerosso?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
```

### packages/web 环境变量

```bash
NEXT_PUBLIC_API_URL=http://[服务器IP]  # API 地址（通过 nginx 代理）
```
