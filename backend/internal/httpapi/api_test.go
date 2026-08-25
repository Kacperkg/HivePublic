package httpapi

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/store"
)

func TestHealth(t *testing.T) {
	t.Parallel()
	handler := New(store.New(nil), slog.Default(), time.Hour, nil)
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
	if response.Header().Get("X-Request-ID") == "" {
		t.Fatal("expected request ID")
	}
}

func TestProtectedRouteRequiresAuthentication(t *testing.T) {
	t.Parallel()
	handler := New(store.New(nil), slog.Default(), time.Hour, nil)
	request := httptest.NewRequest(http.MethodGet, "/v1/me", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", response.Code)
	}
}
