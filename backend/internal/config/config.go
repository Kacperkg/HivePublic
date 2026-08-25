package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Environment    string
	Address        string
	DatabaseURL    string
	AllowedOrigins []string
	SessionTTL     time.Duration
	DatabaseWait   time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		Environment:  env("APP_ENV", "development"),
		Address:      env("HTTP_ADDR", ":8080"),
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		SessionTTL:   30 * 24 * time.Hour,
		DatabaseWait: 30 * time.Second,
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL is required")
	}
	if raw := os.Getenv("SESSION_TTL_HOURS"); raw != "" {
		hours, err := strconv.Atoi(raw)
		if err != nil || hours < 1 {
			return Config{}, fmt.Errorf("SESSION_TTL_HOURS must be a positive integer")
		}
		cfg.SessionTTL = time.Duration(hours) * time.Hour
	}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		cfg.AllowedOrigins = splitComma(origins)
	}
	return cfg, nil
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func splitComma(value string) []string {
	result := make([]string, 0, 2)
	start := 0
	for i := 0; i <= len(value); i++ {
		if i == len(value) || value[i] == ',' {
			if item := trimSpace(value[start:i]); item != "" {
				result = append(result, item)
			}
			start = i + 1
		}
	}
	return result
}

func trimSpace(value string) string {
	start, end := 0, len(value)
	for start < end && (value[start] == ' ' || value[start] == '\t') {
		start++
	}
	for end > start && (value[end-1] == ' ' || value[end-1] == '\t') {
		end--
	}
	return value[start:end]
}
