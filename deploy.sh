#!/bin/bash
set -e

SERVER="root@112.124.27.46"
REMOTE_DIR="/opt/solerosso"

echo "=== 1. 本地打包 ==="
echo "Building API..."
cd packages/api && pnpm build && cd ../..

echo "Building Web..."
cd packages/web && pnpm build && cd ../..

echo "=== 2. 打包部署文件 ==="
cd packages/api
tar czf /tmp/api-dist.tar.gz dist node_modules/.prisma generated
cd ../..
cd packages/web
tar czf /tmp/web-dist.tar.gz .next node_modules
cd ../..

echo "=== 3. 上传到服务器 ==="
ssh $SERVER "mkdir -p $REMOTE_DIR/api $REMOTE_DIR/web"

scp /tmp/api-dist.tar.gz $SERVER:$REMOTE_DIR/api/
scp /tmp/web-dist.tar.gz $SERVER:$REMOTE_DIR/web/

echo "=== 4. 服务器解压 ==="
ssh $SERVER "cd $REMOTE_DIR/api && tar xzf api-dist.tar.gz && rm api-dist.tar.gz"
ssh $SERVER "cd $REMOTE_DIR/web && tar xzf web-dist.tar.gz && rm web-dist.tar.gz"

echo "=== 5. 上传 .env 配置 ==="
scp packages/api/.env $SERVER:$REMOTE_DIR/api/.env

echo "=== 6. 服务器安装依赖 ==="
ssh $SERVER "cd $REMOTE_DIR/api && npm install --omit=dev"
ssh $SERVER "cd $REMOTE_DIR/web && npm install --omit=dev"

echo "=== 7. 启动/重启服务 ==="
ssh $SERVER "pm2 delete solerosso-api 2>/dev/null || true"
ssh $SERVER "pm2 delete solerosso-web 2>/dev/null || true"
ssh $SERVER "cd $REMOTE_DIR/api && pm2 start dist/main.js --name solerosso-api -- --port 3001"
ssh $SERVER "cd $REMOTE_DIR/web && pm2 start node_modules/.bin/next --name solerosso-web -- start -p 3000"
ssh $SERVER "pm2 save"

echo "=== 部署完成 ==="
echo "API: http://112.124.27.46:3001"
echo "Web: http://112.124.27.46:3000"
