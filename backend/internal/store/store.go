package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/domain"
)

var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
)

type Store struct {
	db *sql.DB
}

type DBTX interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

func New(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) DB() *sql.DB {
	return s.db
}

type SessionUser struct {
	domain.User
	PasswordHash string
}

type Session struct {
	ID        string
	TokenHash []byte
	ExpiresAt time.Time
}
