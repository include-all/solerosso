#!/bin/bash
set -e

SERVER="root@112.124.27.46"

echo "=== 服务器初始化（首次部署） ==="

ssh $SERVER << 'EOF'
# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"

# 安装 pm2
if ! command -v pm2 &> /dev/null; then
    echo "安装 pm2..."
    npm install -g pm2
fi

echo "pm2: $(pm2 -v)"

# 设置 pm2 开机自启
pm2 startup systemd -u root --hp /root

echo "=== 服务器初始化完成 ==="
EOF
