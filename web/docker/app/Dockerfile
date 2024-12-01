FROM node:22.9-alpine AS pre-build
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps

FROM pre-build AS build
RUN npm run build

FROM node:22.9-alpine AS pre-prod
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .
COPY --from=build /app/build .
RUN npm install --omit=dev

FROM node:22.9-alpine AS prod
WORKDIR /app
COPY --from=pre-prod /app .
CMD ["node", "index.js"]
