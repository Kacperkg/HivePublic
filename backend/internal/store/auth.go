package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/kacperkg/the-hive/backend/internal/domain"
)

func (s *Store) CreateUserWithSession(ctx context.Context, user domain.User, passwordHash string, session Session) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (id, first_name, surname, email, password_hash)
		VALUES ($1, $2, $3, lower($4), $5)`,
		user.ID, strings.TrimSpace(user.FirstName), strings.TrimSpace(user.Surname), strings.TrimSpace(user.Email), passwordHash)
	if isUniqueViolation(err) {
		return ErrConflict
	}
	if err != nil {
		return err
	}
	if err := insertSession(ctx, tx, user.ID, session); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Store) FindUserByEmail(ctx context.Context, email string) (SessionUser, error) {
	var user SessionUser
	err := s.db.QueryRowContext(ctx, `
		SELECT id, first_name, surname, email, created_at, password_hash
		FROM users WHERE lower(email) = lower($1)`, strings.TrimSpace(email)).Scan(
		&user.ID, &user.FirstName, &user.Surname, &user.Email, &user.CreatedAt, &user.PasswordHash)
	if errors.Is(err, sql.ErrNoRows) {
		return SessionUser{}, ErrNotFound
	}
	return user, err
}

func (s *Store) CreateSession(ctx context.Context, userID string, session Session) error {
	return insertSession(ctx, s.db, userID, session)
}

func insertSession(ctx context.Context, db DBTX, userID string, session Session) error {
	_, err := db.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)`, session.ID, userID, session.TokenHash, session.ExpiresAt)
	return err
}

func (s *Store) UserBySession(ctx context.Context, tokenHash []byte) (domain.User, error) {
	var user domain.User
	err := s.db.QueryRowContext(ctx, `
		UPDATE sessions SET last_used_at = now()
		FROM users
		WHERE sessions.token_hash = $1
		  AND sessions.expires_at > now()
		  AND users.id = sessions.user_id
		RETURNING users.id, users.first_name, users.surname, users.email, users.created_at`, tokenHash).Scan(
		&user.ID, &user.FirstName, &user.Surname, &user.Email, &user.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.User{}, ErrNotFound
	}
	return user, err
}

func (s *Store) DeleteSession(ctx context.Context, tokenHash []byte) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash = $1`, tokenHash)
	return err
}

func (s *Store) DeleteExpiredSessions(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE expires_at <= $1`, time.Now().UTC())
	return err
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
