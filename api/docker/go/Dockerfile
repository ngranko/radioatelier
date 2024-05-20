FROM golang:1.22-alpine as base
WORKDIR /radioatelier
RUN apk add git
COPY . .
RUN go mod download

FROM base as dev
RUN go install github.com/githubnemo/CompileDaemon@latest
ENTRYPOINT CompileDaemon --build="go build -o radioatelier package/main.go" --command=./radioatelier

FROM base as build
RUN go build -o radioatelier package/main.go

FROM alpine:3.17 as prod
WORKDIR /radioatelier
RUN apk add --no-cache tzdata
COPY --from=build /radioatelier/radioatelier .
CMD ["./radioatelier"]
