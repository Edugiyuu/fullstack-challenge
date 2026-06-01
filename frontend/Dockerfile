FROM oven/bun:1-alpine

WORKDIR /repo

COPY package.json bun.lock ./
COPY services/games/package.json services/games/package.json
COPY services/wallets/package.json services/wallets/package.json
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile --filter @crash/frontend

COPY frontend frontend

WORKDIR /repo/frontend

EXPOSE 3000

CMD ["bun", "run", "dev"]
