FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

# 换 apt 国内源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/main.js"]
