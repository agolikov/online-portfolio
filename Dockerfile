FROM node:22-alpine

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.33.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_POSTHOG_KEY=
ARG VITE_POSTHOG_HOST=https://us.i.posthog.com
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

RUN pnpm run build

ENV NODE_ENV=production
ENV DOCKER_RUN_MODE=production
ENV PORT=3010

EXPOSE 3010

CMD ["sh", "-c", "if [ \"$DOCKER_RUN_MODE\" = \"dev\" ] || [ \"$DOCKER_RUN_MODE\" = \"development\" ]; then NODE_ENV=development pnpm run dev; else NODE_ENV=production pnpm run start; fi"]
