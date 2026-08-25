package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"time"

	passwordauth "github.com/kacperkg/the-hive/backend/internal/auth"
	"github.com/kacperkg/the-hive/backend/internal/domain"
	"github.com/kacperkg/the-hive/backend/internal/identity"
	"github.com/kacperkg/the-hive/backend/internal/store"
)

type authRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	FirstName string `json:"firstName"`
	Surname   string `json:"surname"`
	authRequest
}

type authResponse struct {
	Token     string      `json:"token"`
	ExpiresAt time.Time   `json:"expiresAt"`
	User      domain.User `json:"user"`
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	var input registerRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	if fields := domain.ValidateRegistration(input.FirstName, input.Surname, input.Email, input.Password); len(fields) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed", "Check the highlighted fields.", fields)
		return
	}
	hash, err := passwordauth.HashPassword(input.Password)
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	userID, err := identity.UUID()
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	rawToken, digest, err := identity.SessionToken()
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	sessionID, err := identity.UUID()
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	expiresAt := time.Now().UTC().Add(a.sessionTTL)
	user := domain.User{ID: userID, FirstName: strings.TrimSpace(input.FirstName), Surname: strings.TrimSpace(input.Surname),
		Email: strings.ToLower(strings.TrimSpace(input.Email)), CreatedAt: time.Now().UTC()}
	err = a.store.CreateUserWithSession(r.Context(), user, hash, store.Session{ID: sessionID, TokenHash: digest, ExpiresAt: expiresAt})
	if errors.Is(err, store.ErrConflict) {
		writeError(w, http.StatusConflict, "email_in_use", "An account with this email already exists.", nil)
		return
	}
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	writeData(w, http.StatusCreated, authResponse{Token: rawToken, ExpiresAt: expiresAt, User: user})
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var input authRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	user, err := a.store.FindUserByEmail(r.Context(), input.Email)
	if err != nil || !passwordauth.CheckPassword(user.PasswordHash, input.Password) {
		if err != nil && !errors.Is(err, store.ErrNotFound) {
			a.internalError(w, r, err)
			return
		}
		writeError(w, http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect.", nil)
		return
	}
	rawToken, digest, err := identity.SessionToken()
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	sessionID, err := identity.UUID()
	if err != nil {
		a.internalError(w, r, err)
		return
	}
	expiresAt := time.Now().UTC().Add(a.sessionTTL)
	if err := a.store.CreateSession(r.Context(), user.ID, store.Session{ID: sessionID, TokenHash: digest, ExpiresAt: expiresAt}); err != nil {
		a.internalError(w, r, err)
		return
	}
	writeData(w, http.StatusOK, authResponse{Token: rawToken, ExpiresAt: expiresAt, User: user.User})
}

func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	rawToken := r.Context().Value(tokenContextKey).(string)
	if err := a.store.DeleteSession(r.Context(), identity.TokenDigest(rawToken)); err != nil {
		a.internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	writeData(w, http.StatusOK, currentUser(r.Context()))
}
