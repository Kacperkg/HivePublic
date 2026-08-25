package httpapi

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/kacperkg/the-hive/backend/internal/identity"
	"github.com/kacperkg/the-hive/backend/internal/store"
)

const requestIDKey contextKey = "request_id"

func (a *API) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			writeError(w, http.StatusUnauthorized, "unauthorized", "Authentication is required.", nil)
			return
		}
		rawToken := strings.TrimSpace(parts[1])
		user, err := a.store.UserBySession(r.Context(), identity.TokenDigest(rawToken))
		if err == store.ErrNotFound {
			writeError(w, http.StatusUnauthorized, "session_expired", "Your session has expired. Please sign in again.", nil)
			return
		}
		if err != nil {
			a.internalError(w, r, err)
			return
		}
		ctx := context.WithValue(r.Context(), userContextKey, user)
		ctx = context.WithValue(ctx, tokenContextKey, rawToken)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func newRequestID() (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func requestID(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey).(string)
	return id
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}
