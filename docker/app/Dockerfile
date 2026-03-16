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
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=base /app .
RUN npm run build && npm prune --production

FROM node:22.9-alpine AS prod
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
