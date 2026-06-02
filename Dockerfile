FROM node:22-bookworm-slim

WORKDIR /app

# Agrega el repositorio oficial de PostgreSQL para obtener pg_dump v16
# (el cliente de Debian Bookworm solo trae la v15, incompatible con PG16)
RUN apt-get update -y \
    && apt-get install -y curl gnupg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
       | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
       > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update -y \
    && apt-get install -y openssl postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/*

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
