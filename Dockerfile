FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y netcat-openbsd openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

EXPOSE 4000

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
