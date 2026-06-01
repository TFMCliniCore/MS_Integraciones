FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY nest-cli.json tsconfig*.json ./
COPY src ./src

RUN npm run build

RUN mkdir -p /backups

EXPOSE 3009

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run prisma:seed && node dist/main.js"]
