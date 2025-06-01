FROM node:22.9-alpine AS pre-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM pre-build AS build
RUN npm run build
RUN npm prune --production

FROM node:22.9-alpine AS prod
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
