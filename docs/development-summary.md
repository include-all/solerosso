# Solerosso 白板协作工具 - 开发与部署总结

## 一、项目概述

一个基于 WebSocket 的实时白板协作工具，支持多人同时绘制、编辑便签、图形等元素。

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 + React 19 + TypeScript + TailwindCSS |
| 状态管理 | Zustand |
| 画布渲染 | Konva / react-konva |
| 后端 | NestJS + Prisma ORM |
| 数据库 | PostgreSQL 17 |
| 实时通信 | Socket.io |
| 认证 | JWT (access + refresh token) |
| 部署 | Docker + Nginx |

---

## 二、开发过程

### 2.1 后端搭建

1. **NestJS 项目初始化**：使用 `@nestjs/cli` 创建项目
2. **Prisma 集成**：
   - 安装 `@prisma/client` + `@prisma/adapter-pg`
   - 使用 `PrismaPg` adapter 连接 PostgreSQL
   - Schema 定义：User, Board, BoardMember, Element
3. **模块划分**：
   - `auth` - 注册、登录、JWT 刷新
   - `boards` - 白板 CRUD + 成员管理
   - `elements` - 元素 CRUD（JSONB 存储）
   - `collaboration` - WebSocket 实时协作
   - `prisma` - 数据库服务

### 2.2 前端搭建

1. **Next.js 项目初始化**
2. **白板画布**：基于 react-konva 实现
   - 支持工具：选择、便签、画笔、矩形、圆形、箭头、文本
   - 支持缩放、平移、拖拽、变换
3. **API 对接**：Axios 封装 + JWT 拦截器
4. **状态管理**：Zustand store 管理元素和画布状态

### 2.3 数据库设计

```prisma
model Element {
  id        String   @id @default(cuid())
  type      String
  data      Json     // JSONB 存储元素属性
  zIndex    Int      @default(0)
  locked    Boolean  @default(false)
  boardId   String
  createdBy String?
  // ... timestamps, relations
}
```

**关键决策**：使用 PostgreSQL JSONB 存储元素数据，因为：
- 元素属性灵活多变（便签有 text，矩形有 width/height，画笔有 points）
- 避免为每种元素类型创建单独的表
- PostgreSQL JSONB 支持索引查询

---

## 三、遇到的问题与解决方案

### 3.1 后端问题

#### 问题 1：PrismaClient 初始化失败
**错误**：`PrismaClient needs non-empty options`
**原因**：Prisma 7.x 需要显式传入 adapter
**解决**：
```typescript
// packages/api/src/prisma/prisma.service.ts
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: configService.get('DATABASE_URL') });
super({ adapter });
```

#### 问题 2：ESLint 报错 Unsafe call/argument
**错误**：`Unsafe call of a type that could not be resolved`
**原因**：class-validator 装饰器和 req.user 模式
**解决**：在 `eslint.config.mjs` 中禁用相关规则

#### 问题 3：元素更新后数据丢失
**现象**：便签保存文字后，再次进入只剩文字，便签背景消失
**原因**：`updateElement` 只发送变化的字段，覆盖了完整的 data
**解决**：
```typescript
// packages/web/src/lib/store.ts
updateElement: async (id, updates) => {
  const element = get().elements.find((el) => el.id === id);
  const fullData = element ? { ...element, ...updates } : updates;
  // 发送完整数据到后端
  await elementsApi.update(boardId, id, { data: fullData });
}
```

#### 问题 4：ValidationPipe 过滤 data 字段
**错误**：创建元素时 data 字段丢失
**原因**：`CreateElementDto` 的 data 字段缺少 `@IsOptional()` 装饰器，whitelist 模式下被过滤
**解决**：
```typescript
@IsOptional()
data: any;
```

#### 问题 5：Logger 导入路径错误
**错误**：`Module '"@nestjs/websockets"' has no exported member 'Logger'`
**原因**：Logger 应从 `@nestjs/common` 导入
**解决**：
```typescript
import { Logger } from '@nestjs/common';
import { WebSocketGateway, ... } from '@nestjs/websockets';
```

### 3.2 部署问题

#### 问题 1：服务器无法安装 Node.js 16+
**解决方案**：使用 Docker 容器化部署，容器内自带 Node.js 20

#### 问题 2：Docker 镜像拉取超时
**错误**：`dial tcp: lookup docker.mirrors.ustc.edu.cn: no such host`
**原因**：国内服务器访问 Docker Hub 超时，镜像源不可用
**解决**：配置可用的镜像源（详见第五节）

#### 问题 3：apt-get 安装 openssl 超时
**错误**：`Connection timed out`
**解决**：Dockerfile 中换阿里云 apt 源
```dockerfile
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources
```

#### 问题 4：npm 依赖冲突
**错误**：`ERESOLVE unable to resolve dependency tree`
**原因**：peerDependencies 版本不兼容
**解决**：
```dockerfile
RUN npm install --legacy-peer-deps
```

#### 问题 5：npm 安装慢
**解决**：Dockerfile 中配置淘宝 npm 镜像
```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

#### 问题 6：pnpm-lock.yaml 不存在
**错误**：`/pnpm-lock.yaml: not found`
**原因**：monorepo 项目只有根目录有锁文件，各子包没有
**解决**：Dockerfile 改用 npm 而非 pnpm

#### 问题 7：Docker 内存不足
**错误**：`npm error code ENOMEM`
**原因**：低配服务器（2C 2G）同时构建两个服务内存不够
**解决**：分开构建
```bash
docker compose build api && docker compose up -d api
docker compose build web && docker compose up -d web
```

#### 问题 8：dist/main.js 找不到
**错误**：`Cannot find module '/app/dist/main.js'`
**原因**：NestJS 构建输出到 `dist/src/main.js` 而非 `dist/main.js`
**解决**：
```dockerfile
CMD ["node", "dist/src/main.js"]
```

#### 问题 9：Docker 缓存导致旧代码运行
**现象**：重新部署后还是旧版本
**解决**：构建时加 `--no-cache`
```bash
docker compose build --no-cache api
```

#### 问题 10：Nginx 502 Bad Gateway
**原因**：nginx.conf 中使用容器名 `web`/`api` 作为 upstream，宿主机 nginx 无法解析
**解决**：改为 `127.0.0.1:3000` 和 `127.0.0.1:3001`

---

## 四、部署架构

```
用户请求
    ↓
Nginx (80端口)
    ├── /         → [服务器IP]:3000 (Next.js Web)
    ├── /api/     → [服务器IP]:3001 (NestJS API)
    └── /socket.io/ → [服务器IP]:3001 (WebSocket)
```

### Docker 服务

| 服务 | 端口 | 说明 |
|------|------|------|
| solerosso-web | 3000 | Next.js 前端 |
| solerosso-api | 3001 | NestJS 后端 |
| pg17 | 5432 | PostgreSQL 数据库 |
| redis | 6379 | Redis 缓存 |

---

## 五、国内服务器 Docker 镜像源配置

### 5.1 Docker 镜像源

国内服务器访问 Docker Hub 超时，需要配置镜像加速器。

**配置方法**：

```bash
# 创建/编辑配置文件
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
```

**可用镜像源**：
- `https://docker.1ms.run` - 推荐，稳定
- `https://docker.xuanyuan.me` - 备选
- `https://m.daocloud.io` - 部分镜像可能 403

**不可用镜像源**（已失效）：
- `docker.mirrors.ustc.edu.cn` - 解析失败
- `registry.docker-cn.com` - 已关闭

### 5.2 apt 源配置

Dockerfile 中 Debian/Ubuntu 包管理器也需要换源：

```dockerfile
# 在安装包之前执行
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources
RUN apt-get update && apt-get install -y <package>
```

### 5.3 npm 源配置

```dockerfile
# 设置淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 然后正常安装
RUN npm install
```

### 5.4 验证配置

```bash
# 测试 Docker 镜像拉取
docker pull node:20-slim

# 测试 npm 安装
docker run --rm node:20-slim npm config get registry
```

---

## 六、部署命令

### 首次部署

```bash
# 1. 本地执行部署脚本
./deploy-docker.sh

# 2. 服务器配置 nginx
scp nginx.conf root@[服务器IP]:/etc/nginx/conf.d/solerosso.conf
ssh root@[服务器IP] "nginx -t && systemctl reload nginx"
```

### 日常更新

```bash
# 本地执行
./deploy-docker.sh

# 如果需要强制重建（代码有改动）
ssh root@[服务器IP] "cd /opt/solerosso && docker compose build --no-cache api && docker compose up -d"
```

### 常用排查命令

```bash
# 查看容器状态
docker ps -a

# 查看日志
docker logs solerosso-api --tail 100
docker logs solerosso-web --tail 100

# 进入容器调试
docker exec -it solerosso-api sh

# 重启服务
docker compose restart api
```

---

## 七、后续指导

### 7.1 功能扩展

- **撤销/重做**：实现操作历史栈
- **图层管理**：支持元素置顶/置底
- **导出功能**：导出为 PNG/PDF
- **模板系统**：预设白板模板
- **权限细化**：编辑/只读权限

### 7.2 性能优化

- **WebSocket**：考虑使用 Redis Adapter 支持多实例
- **元素懒加载**：大白板按视口加载
- **图片压缩**：上传图片前压缩

### 7.3 生产加固

- **HTTPS**：配置 SSL 证书（Let's Encrypt）
- **环境变量**：敏感信息不写入代码
- **日志收集**：接入 ELK 或 Loki
- **监控告警**：Prometheus + Grafana
- **数据库备份**：定时备份脚本

### 7.4 开发规范

- **Git 提交**：使用语义化 commit message
- **分支管理**：feature → develop → main
- **代码审查**：PR 合并前 review
- **测试覆盖**：核心逻辑编写单元测试
