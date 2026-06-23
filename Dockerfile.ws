FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx

COPY server ./server

ENV NODE_ENV=production
ENV WS_PORT=3001

EXPOSE 3001

CMD ["npx", "tsx", "server/ws-server.ts"]