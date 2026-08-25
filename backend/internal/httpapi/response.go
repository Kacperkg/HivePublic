package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/kacperkg/the-hive/backend/internal/domain"
	"github.com/kacperkg/the-hive/backend/internal/store"
)

type successEnvelope struct {
	Data any `json:"data"`
}

type errorBody struct {
	Code    string             `json:"code"`
	Message string             `json:"message"`
	Fields  domain.FieldErrors `json:"fields,omitempty"`
}

type errorEnvelope struct {
	Error errorBody `json:"error"`
}

func writeData(w http.ResponseWriter, status int, data any) {
	writeJSON(w, status, successEnvelope{Data: data})
}

func writeError(w http.ResponseWriter, status int, code, message string, fields domain.FieldErrors) {
	writeJSON(w, status, errorEnvelope{Error: errorBody{Code: code, Message: message, Fields: fields}})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json", "The request body is invalid.", nil)
		return false
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		writeError(w, http.StatusBadRequest, "invalid_json", "The request body must contain one JSON object.", nil)
		return false
	}
	return true
}

func (a *API) internalError(w http.ResponseWriter, r *http.Request, err error) {
	message := "request failed"
	if isDatabaseUnavailable(err) {
		message = "database unavailable"
	}
	a.logger.Error(message, "request_id", requestID(r.Context()), "error", err)
	writeError(w, http.StatusInternalServerError, "internal_error", "Something went wrong.", nil)
}

func (a *API) storeError(w http.ResponseWriter, r *http.Request, err error, resource string) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", resource+" was not found.", nil)
	case errors.Is(err, store.ErrConflict):
		writeError(w, http.StatusConflict, "conflict", resource+" already exists.", nil)
	default:
		a.internalError(w, r, err)
	}
}
