FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN DATABASE_URL="postgresql://admin:admin@postgres:5432/games" bun prisma generate --config=prisma.config.ts

EXPOSE 4001

CMD ["sh", "-c", "bun prisma migrate deploy --config=prisma.config.ts && bun run src/main.ts"]
