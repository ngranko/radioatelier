FROM golang:1.22-alpine AS base
WORKDIR /radioatelier
RUN apk add git
COPY . .
RUN go mod download

FROM base AS dev
RUN go install github.com/githubnemo/CompileDaemon@latest
ENTRYPOINT CompileDaemon --build="go build -o radioatelier package/main.go" --command=./radioatelier

FROM base AS build
RUN go build -o radioatelier package/main.go

FROM alpine:3.17 AS prod
WORKDIR /radioatelier
RUN apk add --no-cache tzdata
COPY --from=build /radioatelier/radioatelier .
CMD ["./radioatelier"]
