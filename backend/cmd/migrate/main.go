package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/config"
	"github.com/kacperkg/the-hive/backend/internal/database"
	"github.com/kacperkg/the-hive/backend/internal/migrate"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	db, err := database.Open(ctx, cfg.DatabaseURL, 30*time.Second)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	directory := os.Getenv("MIGRATIONS_DIR")
	if directory == "" {
		directory = "./migrations"
	}
	if err := migrate.Up(ctx, db, directory); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations applied")
}
