FROM oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json .
COPY bun.lock .
RUN bun i
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host"]

# using NPM here because bun (at least 1.3.8) leads to a sigill error
# most likely because of the incompatibility with docker build environment
FROM node:26-alpine AS build
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
