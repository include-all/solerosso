FROM node:20-slim

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
