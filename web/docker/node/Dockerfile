FROM node:20-alpine as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:20-alpine as pre-prod
WORKDIR /app
COPY --from=build /app/package.json .
COPY --from=build /app/package-lock.json .
COPY --from=build /app/build .
RUN npm install --omit=dev

FROM node:20-alpine as prod
WORKDIR /app
COPY --from=pre-prod /app .
CMD ["node", "index.js"]
