#!/bin/bash
set -e

# 加载部署配置
source .env.deploy

echo "=== 1. 清理旧文件 ==="
ssh $SERVER_HOST "rm -rf $REMOTE_DIR/*"

echo "=== 2. 创建目录结构 ==="
ssh $SERVER_HOST "mkdir -p $REMOTE_DIR/packages/api $REMOTE_DIR/packages/web"

echo "=== 3. 上传 docker-compose.yml ==="
scp docker-compose.yml $SERVER_HOST:$REMOTE_DIR/

echo "=== 4. 上传 API 文件 ==="
scp packages/api/Dockerfile packages/api/.dockerignore packages/api/package.json packages/api/tsconfig.json packages/api/nest-cli.json $SERVER_HOST:$REMOTE_DIR/packages/api/
scp packages/api/.env $SERVER_HOST:$REMOTE_DIR/packages/api/.env
scp -r packages/api/src $SERVER_HOST:$REMOTE_DIR/packages/api/
scp -r packages/api/prisma $SERVER_HOST:$REMOTE_DIR/packages/api/

echo "=== 5. 上传 Web 文件 ==="
scp packages/web/Dockerfile packages/web/.dockerignore packages/web/package.json packages/web/tsconfig.json packages/web/next.config.ts packages/web/postcss.config.mjs $SERVER_HOST:$REMOTE_DIR/packages/web/
scp -r packages/web/src $SERVER_HOST:$REMOTE_DIR/packages/web/
scp -r packages/web/public $SERVER_HOST:$REMOTE_DIR/packages/web/

echo "=== 6. 验证目录结构 ==="
ssh $SERVER_HOST "ls -la $REMOTE_DIR/ && echo '---' && ls -la $REMOTE_DIR/packages/"

echo "=== 7. 构建并启动 ==="
ssh $SERVER_HOST "cd $REMOTE_DIR && docker compose down && docker compose up -d --build && docker compose ps"

SERVER_IP=$(echo $SERVER_HOST | cut -d@ -f2)
echo "=== 部署完成 ==="
echo "API: http://$SERVER_IP:3001"
echo "Web: http://$SERVER_IP:3000"
