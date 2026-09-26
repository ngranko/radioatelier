FROM oven/bun:1.4-alpine AS base
WORKDIR /app
COPY package.json .
COPY bun.lock .
RUN bun i
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host"]

# using NPM here because bun's x64 build requires AVX, which emulated amd64
# builds on Apple Silicon (Rosetta) lack, so it crashes with SIGILL (still true in 1.4.2)
FROM node:26.5-alpine AS build
WORKDIR /app
ARG PUBLIC_CONVEX_URL
ARG GIT_COMMIT_SHA
ARG RAILWAY_GIT_COMMIT_SHA
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA:-$RAILWAY_GIT_COMMIT_SHA}
ENV PUBLIC_CONVEX_URL=$PUBLIC_CONVEX_URL
COPY --from=base /app .
RUN npm run build && npm prune --production

FROM node:26.5-alpine AS prod
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
