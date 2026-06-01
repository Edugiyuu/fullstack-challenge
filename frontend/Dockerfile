FROM oven/bun:1-alpine

WORKDIR /repo

COPY package.json bun.lock ./
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile

COPY frontend frontend

WORKDIR /repo/frontend

EXPOSE 3000

CMD ["bun", "run", "dev"]
