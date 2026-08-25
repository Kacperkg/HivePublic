FROM golang:1.26.7-alpine AS development
WORKDIR /workspace/backend
COPY go.mod go.sum ./
RUN go mod download
COPY . .
CMD ["go", "run", "./cmd/api"]

FROM development AS build
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api \
    && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/migrate ./cmd/migrate

FROM alpine:3.22 AS production
RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app -g 10001 \
    && adduser -S app -u 10001 -G app
WORKDIR /app
COPY --from=build /out/api /out/migrate ./
COPY migrations ./migrations
USER app
EXPOSE 8080
ENTRYPOINT ["/app/api"]
