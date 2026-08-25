package httpapi

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/domain"
	"github.com/kacperkg/the-hive/backend/internal/store"
)

type API struct {
	store          *store.Store
	logger         *slog.Logger
	sessionTTL     time.Duration
	allowedOrigins []string
}

type contextKey string

const (
	userContextKey  contextKey = "user"
	tokenContextKey contextKey = "token"
)

func New(store *store.Store, logger *slog.Logger, sessionTTL time.Duration, allowedOrigins []string) http.Handler {
	api := &API{store: store, logger: logger, sessionTTL: sessionTTL, allowedOrigins: allowedOrigins}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", api.health)
	mux.HandleFunc("GET /readyz", api.ready)
	mux.HandleFunc("POST /v1/auth/register", api.register)
	mux.HandleFunc("POST /v1/auth/login", api.login)
	mux.Handle("POST /v1/auth/logout", api.authenticate(http.HandlerFunc(api.logout)))
	mux.Handle("GET /v1/me", api.authenticate(http.HandlerFunc(api.me)))
	mux.Handle("GET /v1/workouts", api.authenticate(http.HandlerFunc(api.listWorkouts)))
	mux.Handle("POST /v1/workouts", api.authenticate(http.HandlerFunc(api.createWorkout)))
	mux.Handle("GET /v1/workouts/{workoutID}", api.authenticate(http.HandlerFunc(api.getWorkout)))
	mux.Handle("PUT /v1/workouts/{workoutID}", api.authenticate(http.HandlerFunc(api.updateWorkout)))
	mux.Handle("DELETE /v1/workouts/{workoutID}", api.authenticate(http.HandlerFunc(api.deleteWorkout)))
	mux.Handle("GET /v1/assignments", api.authenticate(http.HandlerFunc(api.listAssignments)))
	mux.Handle("GET /v1/assignments/{date}", api.authenticate(http.HandlerFunc(api.getAssignment)))
	mux.Handle("PUT /v1/assignments/{date}", api.authenticate(http.HandlerFunc(api.assignWorkout)))
	mux.Handle("DELETE /v1/assignments/{date}", api.authenticate(http.HandlerFunc(api.deleteAssignment)))
	mux.Handle("PATCH /v1/assignments/{date}/sets/{setID}", api.authenticate(http.HandlerFunc(api.updateSet)))
	mux.Handle("POST /v1/assignments/{date}/finalize", api.authenticate(http.HandlerFunc(api.finalizeAssignment)))
	mux.Handle("GET /v1/dashboard/{date}", api.authenticate(http.HandlerFunc(api.dashboard)))
	return api.middleware(mux)
}

func (a *API) middleware(next http.Handler) http.Handler {
	return a.cors(a.requestID(a.recoverPanic(a.accessLog(next))))
}

func (a *API) requestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, err := newRequestID()
		if err != nil {
			id = "unavailable"
		}
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey, id)))
	})
}

func (a *API) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				a.logger.Error("panic recovered", "request_id", requestID(r.Context()), "panic", recovered, "stack", string(debug.Stack()))
				writeError(w, http.StatusInternalServerError, "internal_error", "Something went wrong.", nil)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (a *API) accessLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wrapped, r)
		a.logger.Info("request", "request_id", requestID(r.Context()), "method", r.Method,
			"path", r.URL.Path, "status", wrapped.status, "duration_ms", time.Since(start).Milliseconds())
	})
}

func (a *API) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && a.originAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *API) originAllowed(origin string) bool {
	for _, candidate := range a.allowedOrigins {
		if subtle.ConstantTimeCompare([]byte(origin), []byte(candidate)) == 1 {
			return true
		}
	}
	return false
}

func (a *API) health(w http.ResponseWriter, _ *http.Request) {
	writeData(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *API) ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), time.Second)
	defer cancel()
	if err := a.store.DB().PingContext(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "not_ready", "The service is not ready.", nil)
		return
	}
	writeData(w, http.StatusOK, map[string]string{"status": "ready"})
}

func currentUser(ctx context.Context) domain.User {
	return ctx.Value(userContextKey).(domain.User)
}

func isDatabaseUnavailable(err error) bool {
	return err == sql.ErrConnDone
}
